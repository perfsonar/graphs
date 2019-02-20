#!/usr/bin/perl

use strict;
use warnings;

use threads;
use threads::shared;

use CGI;
use Config::General;
use JSON;
use Params::Validate qw(:all);
use JSON qw(from_json);
use FindBin qw($RealBin);
use Time::HiRes;
use Data::Dumper;
use Socket;
use Socket qw( AF_INET AF_INET6 );
use Socket6;
use Data::Validate::IP;
use Log::Log4perl qw(get_logger :easy :levels);
use URI;
use Try::Tiny;
#my $bin = "$RealBin";
#warn "bin: $bin";

#use lib ("$bin/../lib", "$bin/lib"  );
use lib ("/usr/lib/perfsonar/lib", "/usr/lib/perfsonar/graphs/lib"  );

use perfSONAR_PS::Client::Esmond::ApiFilters;
use perfSONAR_PS::Client::Esmond::ApiConnect;
use perfSONAR_PS::Client::Utils qw/send_http_request/;

# Lookup Service libraries
use SimpleLookupService::Client::SimpleLS;
use perfSONAR_PS::Graphs::Functions qw(select_summary_window combine_data);
use perfSONAR_PS::Client::LS::PSRecords::PSService;
use perfSONAR_PS::Client::LS::PSRecords::PSInterface;
use perfSONAR_PS::Utils::LookupService qw(discover_lookup_services);
use perfSONAR_PS::Utils::DNS qw(resolve_address reverse_dns);
use SimpleLookupService::Client::Query;
use SimpleLookupService::QueryObjects::Network::InterfaceQueryObject;


# library for getting host information
use perfSONAR_PS::Utils::Host qw( discover_primary_address get_ethernet_interfaces get_interface_addresses_by_type is_ip_or_hostname is_web_url );

# variable to act as dns cache for dns lookups
my %dns_cache;

my $basedir = "$FindBin::Bin";

my $ua = LWP::UserAgent->new;
$ua->ssl_opts( "verify_hostname" => 0);

my $cgi = new CGI;

my $action = $cgi->param('action') || error("Missing required parameter \"action\", must specify data or tests", 400);

#json file reader for reading ssl certificate flag from the configuration file
my $sslcertjson;
my $configfile = "/etc/perfsonar/graphs.json";
#flag set to 1 only if the certificate config file exists
my $config_set = 0;
my $config;
if(-e $configfile){
  local $/;
  open my $fh, "<", $configfile;
  $sslcertjson = <$fh>;
  close $fh;

  $config_set = 1;
  
  try{
	$config = decode_json($sslcertjson);
  }  catch{
	warn 'The json file used is invalid, please use correct json syntax while editing ' . $configfile ;
  }


}

######

if ($action eq 'data'){
    get_data();
}
elsif ($action eq 'tests'){
    get_tests();
}
elsif ($action eq 'test_list'){
    get_test_list();
}
elsif ($action eq 'has_traceroute_data'){
    has_traceroute_data();
}
elsif ($action eq 'interfaces'){
    get_interfaces();
}
elsif ($action eq 'ls_hosts'){
    get_ls_hosts();
}
elsif ($action eq 'hosts'){
    get_host_info();
}
elsif ($action eq 'ma_data'){
    get_ma_data();
}
else {
    error("Unknown action; must specify either data, tests, hosts, or interfaces", 400);
}

sub cgi_multi_param {
    my ($param) = @_;

    if ($cgi->can('multi_param')) {
        return $cgi->multi_param($param);
    } else {
        return $cgi->param($param);
    }
}

#######

######
# Fallback proxy for esmond requests for esmond instances that don't have CORS enabled
sub get_ma_data {
    my $url = $cgi->param('url');

    if ( not defined $url ) {
        error("No URL specified", 400);
    }


    #if config_set is set to 1, the certificate config file exists
    if($config_set){
        #if ssl certificate ignore is set to false in etc/perfsonar/graphs.json file
        if( defined($config->{'ssl_cert_ignore'}) &&   $config->{'ssl_cert_ignore'} eq 'false' ){
            $ua->ssl_opts( "verify_hostname" => 1);
        }

    }

    # Make sure the URL looks like an esmond URL -- starts with http or https and looks like
    # http://host/esmond/perfsonar/archive/[something]
    # this should be url encoded
    if ( $url =~ m|^https?://[^/]+/esmond/perfsonar/archive| ) {
        # perform http GET on the URL
        my $res = send_http_request(connection_type => 'GET',
                url => $url,
                timeout => 60
            );

        # success
        if ( $res->is_success ) {
            print $cgi->header('application/json');
            my $message = $res->body;
            print $message;
        } else {
            # if there is an error, return the error message and code
            error($res->message, $res->code);
        }
    } else {
        # url does not appear to be a valid esmond archive
        warn "URL is not a valid esmond archive: $url";
        error("URL is not a valid esmond archive");
    }

}

sub get_data {
    my $summary_window;
    my $window = $cgi->param('window');
    my @valid_windows = (0, 60, 300, 3600, 86400);
    $summary_window = 3600;
    $summary_window = $window if (defined($window) && (grep {$_ eq $window} @valid_windows));

    my @urls        = cgi_multi_param('url');
    my @rev_urls    = cgi_multi_param('reverseurl');
    my @sources     = cgi_multi_param('src');
    my @dests       = cgi_multi_param('dest');
    my @ipversions  = cgi_multi_param('ipversion');
    my @agents      = cgi_multi_param('agent');
    my @tools       = cgi_multi_param('tool');
    my @protocols   = cgi_multi_param('protocol');
    my @filters     = cgi_multi_param('filter');
    
    my $start       = $cgi->param('start')   || error("Missing required parameter \"start\"", 400);
    my $end         = $cgi->param('end')     || error("Missing required parameter \"end\"", 400);
    my $displayset_source = $cgi->param('pscheduler-reference-display-set-source');
    my $displayset_dest   = $cgi->param('pscheduler-reference-display-set-dest');
    
    if (!$displayset_source && !$displayset_dest && (@sources == 0 || @sources != @dests || @sources != @urls)){
	    error("There must be an equal non-zero amount of src, dest, and url options passed.", 400);
    }elsif($displayset_source && !$displayset_dest && (@sources > 1 || @dests != 1)){
        error("There must be at most one source parameter and a single dest or pscheduler-reference-display-set-dest parameter when using pscheduler-reference-display-set-source.", 400);
    }elsif($displayset_dest && !$displayset_source && (@dests > 1 || @sources != 1)){
        error("There must be at most one dest parameter and a single source or pscheduler-reference-display-set-source parameter when using pscheduler-reference-display-set-dest.", 400);
    }elsif(@rev_urls > 0 && @rev_urls != @urls){
        error("When specifying a reverseurl, you must provide the same amount of reverseurl options as url options");
    }

    if ( !is_web_url( { address => \@urls} ) ) {
        error("Invalid URL specified", 400);
    }

    if ( !$displayset_source && !is_ip_or_hostname( {address => \@sources} ) ) {
        error("Invalid source ip address specified", 400);
    }

    if ( !$displayset_dest && !is_ip_or_hostname( {address => \@dests} ) ) {
        error("Invalid destination ip address specified", 400);
    }

    if ( @agents && !is_ip_or_hostname( {address => \@agents, required => 0} ) ) {
        error("Invalid measurement agent ip address specified", 400);
    }


    my @base_event_types   = ('throughput', 'histogram-owdelay', 'packet-loss-rate', 'packet-retransmits', 'histogram-rtt', 'failures');
    my @mapped_event_types = ('throughput', 'owdelay', 'loss', 'packet_retransmits', 'ping', 'errors', 'owdelay_minimum', 'owdelay_median', 'ping_minimum', 'ping_maximum', 'error', 'error_tool');

    my %results;
    my %types_to_ignore = ();

    my @threads;
    
    if($displayset_source || $displayset_dest){
        # If one of the displayset options given, we will use that to query
        my $test_src = @sources > 0 ? $sources[0] : undef;
        my $test_dest = @dests > 0 ? $dests[0] : undef;
        my $thread = threads->create(\&_get_test_data,
            $test_src,
            $test_dest,
            $displayset_source,
            $displayset_dest,
            $start,
            $end,
            $summary_window,
            $urls[0],
            $ipversions[0],
            $agents[0],
            $tools[0],
            $protocols[0],
            $filters[0],
            \@base_event_types,
            \@mapped_event_types,
            \%types_to_ignore
        );
        push(@threads, $thread);
        
        my $thread_rev = threads->create(\&_get_test_data,
            $test_dest,
            $test_src,
            $displayset_dest,
            $displayset_source,
            $start,
            $end,
            $summary_window,
            @rev_urls > 0 ? $rev_urls[0] : $urls[0],
            $ipversions[0],
            $agents[0],
            $tools[0],
            $protocols[0],
            $filters[0],
            \@base_event_types,
            \@mapped_event_types,
            \%types_to_ignore
        );
        push(@threads, $thread_rev);
    }else{
        for (my $j = 0; $j < @sources; $j++){
            my $is_reverse = 0;
            foreach my $ordered ([$sources[$j], $dests[$j]], [$dests[$j], $sources[$j]]){
                my ($test_src, $test_dest) = @$ordered;

                my $thread = threads->create(\&_get_test_data,
                    $test_src,
                    $test_dest,
                    undef,
                    undef,
                    $start,
                    $end,
                    $summary_window,
                    ($is_reverse && @rev_urls > $j) ? $rev_urls[$j] : $urls[$j],
                    $ipversions[$j],
                    $agents[$j],
                    $tools[$j],
                    $protocols[$j],
                    $filters[$j],
                    \@base_event_types,
                    \@mapped_event_types,
                    \%types_to_ignore
                );

                push(@threads, $thread);
                $is_reverse++;
            }
        }
    }
    
    my $displayset_map = {};
    foreach my $thread (@threads){
    	my $ret_array = $thread->join();
    	#error("Error fetching data") if (! $ret_array);	#do not throw error if a thread fails.
        
    	foreach my $ret (@$ret_array){

            my $test_src        = $ret->{'test_src'} ? $ret->{'test_src'} : $ret->{'input_source'};
            my $test_dest       = $ret->{'test_dest'} ? $ret->{'test_dest'} : $ret->{'input_dest'};
            my $multiple_values = $ret->{'multiple_values'};
            my $remapped_name   = $ret->{'remapped_name'};
            my @data_points     = @{$ret->{'data'}};
            my @summary_fields  = @{$ret->{'summary_fields'}};
            my %additional_data = %{$ret->{'additional_data'}};
            $displayset_map->{$test_src} = $ret->{'displayset_src'} if($ret->{'displayset_src'});
            $displayset_map->{$test_dest} = $ret->{'displayset_dest'} if($ret->{'displayset_dest'});
            
            if (!$multiple_values) {
                if (exists($results{$test_src}{$test_dest}{$remapped_name}) && @{$results{$test_src}{$test_dest}{$remapped_name}} > 0) { 
                    my @existing_data_points = @{$results{$test_src}{$test_dest}{$remapped_name}};
                    @data_points = (@existing_data_points, @data_points);
                }
                $results{$test_src}{$test_dest}{$remapped_name} = \@data_points if @data_points > 0; 

            } else {
                if (@summary_fields > 0 && keys(%additional_data) > 0) {
                    while (my ($key, $values) = each (%additional_data)) {
                        my @new_data_points = ();
                        @new_data_points = @$values;
                        if (exists($results{$test_src}{$test_dest}{$key}) && @{$results{$test_src}{$test_dest}{$key}} > 0) { 
                            my @existing_data_points = @{$results{$test_src}{$test_dest}{$key}};
                            @new_data_points = (@existing_data_points, @new_data_points);
                        }
                        $results{$test_src}{$test_dest}{$key} = \@new_data_points if @new_data_points > 0; 
                    }
                }
            }
    	}
    }
    
    # CONSOLIDATE ALL TESTS IN ONE DATASTRUCTURE
    my %consolidated;
    while (my ($src, $values) = each %results) {
        while (my ($dst, $result_types) = each %$values) {

            foreach my $type (@mapped_event_types) {
                next if $types_to_ignore{$type};

                my $src_was_orig_src = 0;
                my $dst_was_orig_src = 0;
                if($displayset_source){
                    $src_was_orig_src = $displayset_map->{$src} eq $displayset_source ? 1 : 0;
                    $dst_was_orig_src = $displayset_map->{$dst} eq $displayset_source ? 1 : 0;
                }else{
                    $src_was_orig_src = grep {$_ eq $src} @sources;
                    $dst_was_orig_src = grep {$_ eq $dst} @sources;
                }
                 

                my $data_set;
                my $key_prefix;

                # Figure out which direction we're looking at here, was it src->dst
                # or was it dst->src?
                if (exists $results{$src}{$dst}{$type} && $src_was_orig_src){
                    $data_set   = $results{$src}{$dst}{$type};
                    $key_prefix = "src";
                }
                elsif (exists $results{$src}{$dst}{$type} && $dst_was_orig_src){
                    $data_set   = $results{$src}{$dst}{$type};
                    $key_prefix = "dst"; 
                } else {
                    # result is not set, skip this row
                    next;
                }

                my $type_key = $type . '_' . $key_prefix;
                $consolidated{$type_key} ||= [];

                next unless ($data_set);

                foreach my $data (@$data_set) {
                    my @row;

                    while (my ($key, $val) = each %$data) {
                        if ($key eq 'ts') {
                            $row[0] = int $val;
                        } elsif ($key eq 'val') {
                            $row[1] = $val;
                        }
                    }

                    push @{$consolidated{$type_key}}, \@row;
                }
            }
        }
    }

    print $cgi->header('text/json');

    print to_json(\%consolidated);
}

sub _get_test_data {
    my $test_src           = shift;
    my $test_dest          = shift;
    my $displayset_src     = shift;
    my $displayset_dest    = shift;
    my $start              = shift;
    my $end                = shift;
    my $summary_window     = shift;
    my $url                = shift;
    my $ipversion          = shift;
    my $agent              = shift;
    my $tool               = shift;
    my $protocol           = shift;
    my $custom_filters     = shift;
    my $base_event_types   = shift;
    my $mapped_event_types = shift;
    my $types_to_ignore    = shift;

    my @mapped_event_types = @$mapped_event_types;

    my $filter = new perfSONAR_PS::Client::Esmond::ApiFilters();
    if($displayset_src){
        $filter->{metadata_filters}->{'pscheduler-reference-display-set-source'} = $displayset_src;
    }else{
        $filter->source($test_src);
    }
    if($displayset_dest){
        $filter->{metadata_filters}->{'pscheduler-reference-display-set-dest'} = $displayset_dest;
    }else{
        $filter->destination($test_dest);
    }
    $filter->measurement_agent($agent) if($agent);
    $filter->tool_name($tool) if($tool);
    $filter->time_start($start) if ($start);
    $filter->time_end($end) if ($end);
    $filter->{metadata_filters}->{'ip-transport-protocol'} = $protocol if($protocol);
    if($ipversion){
        if($ipversion eq '6'){
            $filter->dns_match_only_v6();
        }elsif($ipversion eq '4'){
            $filter->dns_match_only_v4();
        }
    }
    #custom params in the form of key1:value1;key2:value2
    if($custom_filters){
        foreach my $filter_pair_str(split(',', $custom_filters)){
            my @filter_pair = split(':', $filter_pair_str);
            next if(@filter_pair != 2);
            $filter->{metadata_filters}->{$filter_pair[0]} = $filter_pair[1];
        }
    }

    my $client = new perfSONAR_PS::Client::Esmond::ApiConnect(url     => $url,
							      filters => $filter);

    my $metadata = $client->get_metadata();

    if ($client->error){
        error("Error reaching MA: " . $client->error);
        return undef;
    }

    my @return_values;
    
    
    foreach my $metadatum (@$metadata) {
        for (my $i = 0; $i < @$base_event_types; $i++){
            my $event_type = $base_event_types->[$i];

            my $event = $metadatum->get_event_type($event_type);
            next if !$event;

            # Figure out how to map into prettier names that don't reveal
            # underlying constructs
            my $remapped_name = $mapped_event_types[$i];

            $event->filters->time_start($start);
            $event->filters->time_end($end);
            my $source_host = $metadatum->input_source();
            my $destination_host = $metadatum->input_destination();
            my $tool_name = $metadatum->tool_name();

            #my @data_points;
            my $data;
            my $total = 0;
            my $average;
            my $min = undef;
            my $max = undef; 
            my $multiple_values = 0;
            my @summary_fields = ();
            my $summary_type = 'none';

            if ($event_type eq 'histogram-owdelay' || $event_type eq 'histogram-rtt') {
                $multiple_values = 1;
                my $stats_summ;
                $summary_type = 'statistics';
                my $req_summary_window = select_summary_window($event_type, $summary_type, $summary_window, $event);

                $stats_summ = $event->get_summary($summary_type, $req_summary_window);

                error($event->error) if ($event->error);
                @summary_fields = ( 'minimum', 'median' );
                $data = $stats_summ->get_data() if defined $stats_summ;
                if (defined($data) && @$data > 0){
                    foreach my $datum (@$data){
                        $total += $datum->val->{mean};
                        $max = $datum->val->{maximum} if !defined($max) || $datum->val->{maximum} > $max;
                        $min = $datum->val->{minimum} if !defined($min) || $datum->val->{minimum} < $min;
                    }
                    $average = $total / @$data;
                }
            } elsif ($event_type eq 'failures') {
                $multiple_values = 1;
                @summary_fields = ('error', 'error_tool');
                $data = $event->get_data();
            } else {
                if ($event_type eq 'packet-loss-rate') {
                    $summary_type = 'aggregation';
                    my $req_summary_window = select_summary_window($event_type, $summary_type, $summary_window, $event);
                    if ($req_summary_window != -1) {
                        my $stats_summ = $event->get_summary($summary_type, $req_summary_window);
                        error($event->error) if ($event->error);
                        $data = $stats_summ->get_data() if defined $stats_summ;
                    } else {
                        $data = $event->get_data();
                    }
                } 
                else {
                    $data = $event->get_data();
                }
                if (defined($data) && @$data > 0) {
                    if ($event_type ne 'failures') {
                        foreach my $datum (@$data){
                            $total += $datum->val;
                            $max = $datum->val if !defined($max) || $datum->val > $max;
                            $min = $datum->val if !defined($min) || $datum->val < $min;
                        }
                        $average = $total / @$data;
                    } 
                }
            }

            my @data_points = ();
            my %additional_data = ();
            foreach my $datum (@$data){
                my $ts = $datum->ts;
                my $val;
                my $median_val;
                if ($multiple_values) {
                    $types_to_ignore->{$remapped_name} = 1;
                    if ($event_type eq 'failures') {
                        foreach my $field(@summary_fields) {
                            my $key = $field;
                            if ($key eq 'error_tool') {
                                $val = $tool_name;
                            } else {
                                $val = $datum->{val}->{$field};
                            }
                            push @{$additional_data{$key}}, {'ts' => $ts, 'val' => $val };
                        }

                    } else {
                        foreach my $field(@summary_fields) {
                            my $key = $remapped_name . '_' . $field;
                            push @{$additional_data{$key}}, {'ts' => $ts, 'val' => $datum->{val}->{$field}};
                        }
                    }
                } else {
                    if ($event_type ne 'failures') {
                        $val = $datum->val;
                    }
                    push(@data_points, {'ts' => $ts, 'val' => $val});
                }
            }

            push(@return_values,  {
                    test_src           => $test_src,
                    test_dest          => $test_dest,
                    displayset_src     => $displayset_src,
                    displayset_dest    => $displayset_dest,
                    input_source       => $source_host,
                    input_dest         => $destination_host,
                    data               => \@data_points,
                    multiple_values    => $multiple_values,
                    remapped_name      => $remapped_name,
                    additional_data    => \%additional_data,
                    summary_fields     => \@summary_fields
                });
        }
    }

    return \@return_values;
}

# has_traceroute_data is the webservice that is called to see if a source/dest pair
# has traceroute data defined in the specified MA
sub has_traceroute_data {
    my $url    = $cgi->param('url')   || error("Missing required parameter \"url\"", 400);
    my $source    = $cgi->param('source')   || error("Missing required parameter \"url\"", 400);
    my $dest    = $cgi->param('dest')   || error("Missing required parameter \"url\"", 400);
    if ( !is_ip_or_hostname( {address => $source} ) ) {
        error("Invalid source ip address specified", 400);
    }
    if ( !is_ip_or_hostname( {address => $dest} ) ) {
        error("Invalid destination ip address specified", 400);
    }


    my $results = check_traceroute_data( { source => $source, dest => $dest, url => $url } );

    print $cgi->header('text/json');
    print to_json($results);
}

# check_traceroute_data is used to retrieve just the hostname/ips of source and destination
# of active tests in an MA. 
sub check_traceroute_data {
    my $parameters = validate(@_, {source => 1, dest => 1, url => 1});
    my $source = $parameters->{source};
    my $dest = $parameters->{dest};
    my $url = $parameters->{url};

    my $time_range = 86400;

    my @active_tests;
    my %active_hosts;
    my %hosts;
    my $results;
    my $now = time;
    my $start_time = $now - $time_range;
    my $metadata_out = [];

    my $result = { source => $source, dest => $dest, has_traceroute => 0, traceroute_last_updated => 0 };

    foreach my $ordered ([$source, $dest], [$dest, $source]){
        my ($src, $dst) = @$ordered;

    my $filter = new perfSONAR_PS::Client::Esmond::ApiFilters(); 
    $filter->time_range( $time_range ); # last 24 hours
    $filter->source($src);
    $filter->destination($dst);
    $filter->event_type('packet-trace');
    my $client = new perfSONAR_PS::Client::Esmond::ApiConnect(url     => $url,
							      filters => $filter);

    my $metadata = $client->get_metadata();
    error($client->error) if ($client->error);

    HOSTS: foreach my $metadatum (@$metadata) {
        push @$metadata_out, $metadatum->{data};
        $hosts{ $metadatum->{'data'}->{'source'} } = 1;
        $hosts{ $metadatum->{'data'}->{'destination'} } = 1;
        foreach my $event_type (@{$metadatum->{'data'}->{'event-types'}}) {
            if (defined ($event_type->{'time-updated'}) && $event_type->{'time-updated'} > $start_time ) {
                my $source = $metadatum->{'data'}->{'source'};
                my $dest = $metadatum->{'data'}->{'destination'};
                $active_hosts{ $source } = 1;
                my $time_updated = $event_type->{'time-updated'};
                if (exists($result->{traceroute_last_updated}) && $time_updated < $result->{traceroute_last_updated}) {
                    $time_updated = $result->{traceroute_last_updated};
                }

                $result->{traceroute_last_updated} = $time_updated;
                $result->{has_traceroute} = 1;
                $result->{ma_url} = $url;
                $result->{traceroute_uri} = $event_type->{'base-uri'};
                next HOSTS;
            }
        }

    }
}

    $results = \@active_tests;

    return $result;
}

sub _get_local_addresses_hash {
    my $addr_array = _get_local_addresses();
    my %addr_hash = ();

    foreach my $addr (@$addr_array) {
        $addr_hash{ $addr } = 1;
    }
    return \%addr_hash;

}

sub _get_local_addresses {

    my @interfaces = get_ethernet_interfaces();
    my @addresses;
    foreach my $interface (@interfaces){
        my $iface;

        my $address = get_interface_addresses_by_type({interface=>$interface});
        $iface = $address;
        if ($address->{'ipv4_address'}) {
            foreach my $addr ( @{ $address->{'ipv4_address'} } ) {
                push @addresses, $addr;
            }
        }
        if ($address->{'ipv6_address'}) {
            foreach my $addr ( @{ $address->{'ipv6_address'} } ) {
                push @addresses, $addr;
            }
        }
        $iface->{iface} = $interface;
    }
    return \@addresses;
}

# get_test_list is used to retrieve just the hostname/ips of source and destination
# of active tests in an MA. 
sub get_test_list {
    my $url    = $cgi->param('url')   || error("Missing required parameter \"url\"");
    # timeperiod in the url is really "timeperiod,summary_window"
    my $timeperiod = 86400 * 7;
    if (defined $cgi->param('timeperiod')) {
        ($timeperiod, my $y) = split(',' , $cgi->param('timeperiod')); 
    } 

    my $addresses = _get_local_addresses_hash();

    my $filter = new perfSONAR_PS::Client::Esmond::ApiFilters(); 
    $filter->time_range( $timeperiod );
    $filter->subject_type('point-to-point');

    my $client = new perfSONAR_PS::Client::Esmond::ApiConnect(url     => $url,
							      filters => $filter);

    my $metadata = $client->get_metadata();
    error($client->error) if ($client->error);

    my $results;
    my %hosts;
    my @active_tests;
    my %active_hosts;
    my $now = time;
    my $start_time = $now - $timeperiod;
    my $metadata_out = [];

    my $dns_time = 0; # TODO: remove dns_time (benchmarking)
    my $dns_requests = 0;

    # TODO: review this, do we need to do all this for each host? 
    HOSTS: foreach my $metadatum (@$metadata) {
        push @$metadata_out, $metadatum->{data};
        $hosts{ $metadatum->{'data'}->{'source'} } = 1;
        $hosts{ $metadatum->{'data'}->{'destination'} } = 1;
        foreach my $event_type (@{$metadatum->{'data'}->{'event-types'}}) {
            my $type        = $event_type->{"event-type"};

            next unless ($type eq 'throughput' || $type eq 'packet-loss-rate' || $type eq 'histogram-owdelay' || $type eq 'histogram-rtt');

            if (defined ($event_type->{'time-updated'}) && $event_type->{'time-updated'} > $start_time ) {

                if ( exists $addresses->{ $metadatum->{'data'}->{'destination'} } ) {
                    # swap 'source' and 'destination' (use 'tmp' as a holder)
                    $metadatum->{'data'}->{'tmp'} = $metadatum->{'data'}->{'source'};
                    $metadatum->{'data'}->{'source'} = $metadatum->{'data'}->{'destination'};
                    $metadatum->{'data'}->{'destination'} = $metadatum->{'data'}->{'tmp'};
                }

                my $source = $metadatum->{'data'}->{'source'};
                my $dest = $metadatum->{'data'}->{'destination'};
                $active_hosts{ $source } = 1;

                my $dns_start = Time::HiRes::time();
                my $hostnames = host_info( {src => $source, dest => $dest} );
                my $dns_end = Time::HiRes::time();
                my $dns_delta = $dns_end - $dns_start;
                $dns_time += $dns_delta;
                $dns_requests++;
                # TODO: take this out (for perf testing only)
                #warn "hostname parameters: source: $source; dest: $dest";
                #my $hostnames = { source_host => $source, dest_host => $dest, source_ip => $source, dest_ip => $dest };

                my $source_host = $hostnames->{source_host};
                my $destination_host = $hostnames->{dest_host};
                my $source_ip = $hostnames->{source_ip};
                my $destination_ip = $hostnames->{dest_ip};
                my $test = {
                    source => $source,
                    destination => $dest,
                    source_ip => $source_ip,
                    destination_ip => $destination_ip,
                    source_host => $source_host,
                    destination_host => $destination_host,
                    last_updated => $event_type->{'time-updated'},
                    #event_type => $event_type->{'event-type'}
                };
                # only add this src/dest pair if it doesn't already exist, either
                # in the same direction, or reverse direction.
                if ( (!  grep {$_->{source} eq $source && $_->{destination} eq $dest} @active_tests)
                    && (! grep {$_->{source} eq $dest && $_->{destination} eq $source} @active_tests) ) {
                    push @active_tests, $test;
                }
                next HOSTS;
            }
        }

    }

    $results = \@active_tests;

    print $cgi->header('text/json');
    print to_json(\@$results);
}

sub get_tests {
    # Get averages for test summary table
    my $url    = $cgi->param('url')   || error("Missing required parameter \"url\"");
    my $timeperiod = 86400 * 7;
    my $summary_window = 3600;
    # timeperiod in the url is really "timeperiod,summary_window"
    if (defined $cgi->param('timeperiod')) {
        ($timeperiod, my $y) = split(',' , $cgi->param('timeperiod')); 
        $summary_window = $y if($y);
    } 
    my $flatten = 1;
    $flatten = $cgi->param('flatten') if (defined $cgi->param('flatten'));
    # put sources and dests in the url to limit to those only. 
    # src=x.x.x.x;src=y.y.y.y;... or src=x.x.x.x;dest=z.z.z.z;src=y.y.y.y..., just watch the order.
    my @sources;
    my @dests;
    @sources     = cgi_multi_param('src') if (defined cgi_multi_param('src'));
    @dests       = cgi_multi_param('dest') if (defined cgi_multi_param('dest'));
    if ( (@sources or @dests) and @sources != @dests ) {
        error("get_tests: There must be an equal number of src and dest params, if any", 400);
    }

    my $show_details = 0;
    my $start_time = [Time::HiRes::gettimeofday()];

    my $addresses = _get_local_addresses_hash();

    my $filter = new perfSONAR_PS::Client::Esmond::ApiFilters();
    $filter->time_range( $timeperiod );
    $filter->subject_type('point-to-point');
    #$filter->limit(10); #return up to 10 results
    #$filter->offset(0); # return the first results you find

    my $client = new perfSONAR_PS::Client::Esmond::ApiConnect(url     => $url,
							      filters => $filter);

    my $total_metadata = 0;
    my $method_start_time = [Time::HiRes::gettimeofday()];
    $start_time = [Time::HiRes::gettimeofday()];
    #$filter->offset(0);
    my $metadata = $client->get_metadata();
    $total_metadata += Time::HiRes::tv_interval($start_time);
    error($client->error) if ($client->error);

    my %results;

    my $now = time;
    my $total_data = 0;
    my $all_types = [];

    foreach my $metadatum (@$metadata){
        my $src = $metadatum->source();
        my $dst = $metadatum->destination();

        # Do this test if it's in the lists of sources and destinations (forward or reverse)
        # (Do all tests if no sources/dests are given)
        my $dothistest = 0;
        if (!@sources) {
            $dothistest = 1;
        } else { 
            for my $i (0 .. $#sources) {
                if ( ($src eq $sources[$i] and $dst eq $dests[$i])  
                     or ($src eq $dests[$i] and $dst eq $sources[$i]) ) {
                    $dothistest = 1;
                    last;
                } 
            }
        }
        next if ( !$dothistest );

        my $event_types = $metadatum->get_all_event_types();

        my $protocol = $metadatum->get_field('ip-transport-protocol');
        my $duration = $metadatum->get_field('time-duration');
        my $bucket_width = $metadatum->get_field('sample-bucket-width');
        my $source_ip = $src;
        my $destination_ip = $dst;

        foreach my $event_type (@$event_types){

            my $full_type   = $event_type->event_type();
            my $last_update = $event_type->time_updated(); 

            # Currently, we hard-code the list of event types we will accept for our listing. If we retrieve all of them,
            # performance is too poor and we don't care about many of them.
            # Ideally, this would be configurable.
            next unless ($full_type eq 'throughput' || $full_type eq 'packet-loss-rate' ||
                         $full_type eq 'histogram-owdelay' || $full_type eq 'histogram-rtt');

            my $type = $full_type;
            $type = 'loss' if ($full_type eq 'packet-loss-rate');
            $type = 'owdelay' if ($full_type eq 'histogram-owdelay');
            $type = 'rtt' if ($full_type eq 'histogram-rtt');

            # now grab the last $timeperiod seconds worth of data to generate a high level view
            my $start_time = $now - $timeperiod;
            $event_type->filters->time_start($start_time);
            $event_type->filters->time_end($now);
            $event_type->filters->source($src);
            $event_type->filters->destination($dst);

            # we only want to see point-to-point tests
            $event_type->filters->subject_type('point-to-point');

            $start_time = [Time::HiRes::gettimeofday()];
            my $data;
            my $total = 0;
            my $average;
            my $min = undef;
            my $max = undef;
            my $actual_window = $summary_window;
            if ($type eq 'owdelay' || $type eq 'rtt') {
                # latency
                if ($show_details || 1) {
                    $actual_window = select_summary_window($full_type, 'statistics', $summary_window, $event_type);
                    my $stats_summ = $event_type->get_summary('statistics', $actual_window);
                    error($event_type->error) if ($event_type->error);
                    $data = $stats_summ->get_data() if defined $stats_summ;
                    if (defined($data) && @$data > 0){
                        push @$all_types, $type if (!grep {$_ eq $type} @$all_types);
                        foreach my $datum (@$data){
                            $total += $datum->val->{mean};
                            $max = $datum->val->{maximum} if !defined($max) || $datum->val->{maximum} > $max;
                            $min = $datum->val->{minimum} if !defined($min) || $datum->val->{minimum} < $min;
                        }
                        if($bucket_width){
                            #if bucketwidth is defined, normalize to milliseconds
                            $total = ($total * $bucket_width)/0.001;
                            $max = ($max * $bucket_width)/0.001;
                            $min = ($min * $bucket_width)/0.001;
                        }
                        $average = $total / @$data;
                    }
                } else {
                    if (defined ($event_type->{data}->{'time-updated'}) && $event_type->{data}->{'time-updated'} > $start_time ) {
                        $min = 1;
                        $average = 5;
                        $max = 10;
                    }
                }
            } else {
                if ($type eq 'loss') {
                    # loss
                    $actual_window = select_summary_window($full_type, 'aggregation', $summary_window, $event_type);
                    my $stats_summ = $event_type->get_summary('aggregation', $actual_window);
                    error($event_type->error) if ($event_type->error);
                    $data = $stats_summ->get_data() if defined $stats_summ;
                } else {
                    # throughput
                    $data = $event_type->get_data();
                }
                if (defined($data) && @$data > 0){
                    push @$all_types, $type if (!grep {$_ eq $type} @$all_types);
                    foreach my $datum (@$data){
                        $total += $datum->val;
                        $max = $datum->val if !defined($max) || $datum->val > $max;
                        $min = $datum->val if !defined($min) || $datum->val < $min;
                    }
                    $average = $total / @$data;
                }
            }
            $total_data += Time::HiRes::tv_interval($start_time);

            error($event_type->error) if ($event_type->error);

            if (defined($data) && @$data > 0 ) {
                $results{$src}{$dst}{$type} = {last_update  => $last_update,
                    timeperiod_average => $average,
                    timeperiod_min     => $min,
                    timeperiod_max     => $max,
                    duration     => $duration,
                    protocol     => $protocol,
                    bidirectional => 0};
            }
        }
    }

    # CONSOLIDATE BIDIRECTIONAL TESTS
    if (1) {
        foreach my $src ( keys %results ) {
            my $values = $results{ $src };
            foreach my $dst ( keys %$values ) {
                my $types = $values->{ $dst };
                foreach my $type (@$all_types) {
                    my $bidirectional = 0;
                    my ($src_res, $src_average, $src_min, $src_max, $source_host);
                    my ($dst_res, $dst_average, $dst_min, $dst_max, $destination_host);
                    my ($average, $min, $max, $duration, $last_update, $protocol);
                    if (exists($results{$src}{$dst}{$type})) {
                        $src_res = $results{$src}{$dst}{$type};
                        $src_average = $src_res->{'timeperiod_average'};
                        $src_min = $src_res->{'timeperiod_min'};
                        $src_max = $src_res->{'timeperiod_max'};
                        $protocol = $src_res->{'protocol'};

                    }
                    if (exists($results{$dst}{$src}{$type})) {
                        $dst_res = $results{$dst}{$src}{$type};
                        $average = undef;
                        $dst_average = $dst_res->{'timeperiod_average'};
                        $dst_min = $dst_res->{'timeperiod_min'};
                        $dst_max = $dst_res->{'timeperiod_max'};

                        $min = $dst_res->{'timeperiod_min'};
                        $max = $dst_res->{'timeperiod_max'};
                        $duration = $dst_res->{'duration'};
                        $last_update = $dst_res->{'last_update'} || 0;
                        $protocol = $dst_res->{'protocol'};
                        $bidirectional = 1 if (defined ($results{$dst}{$src}{$type}->{'timeperiod_average'}) && defined ($results{$src}{$dst}{$type}->{'timeperiod_average'}) );

                        # Now combine with the source values
                        $min = $src_res->{'timeperiod_min'} if (defined($src_res->{'timeperiod_min'}) && (!defined($min) || $src_res->{'timeperiod_min'} < $min));
                        $max = $src_res->{'timeperiod_max'} if (defined($src_res->{'timeperiod_max'}) && (!defined($max) || $src_res->{'timeperiod_max'} > $max));

                        if (defined $src_average && defined($dst_average)) {
                            $average = ($src_average + $dst_average) / 2;
                        } elsif (defined $src_average) {
                            $average = $src_average;
                        } elsif (defined $dst_average) {
                            $average = $dst_average;
                        }

                        $last_update = $src_res->{'last_update'} if (defined ($src_res->{'last_update'}) &&  $src_res->{'last_update'} > $last_update );
                        $protocol = $src_res->{'protocol'} if !defined $protocol;
                        $duration = $src_res->{'duration'} if !defined $duration;;

                        delete $results{$dst}{$src}{$type};
                    }
                        $results{$src}{$dst}{$type}->{'timeperiod_max'} = $max;
                        $results{$src}{$dst}{$type}->{'timeperiod_min'} = $min;
                        $results{$src}{$dst}{$type}->{'timeperiod_average'} = $average;
                        $results{$src}{$dst}{$type}->{'last_update'} = $last_update;
                        $results{$src}{$dst}{$type}->{'duration'} = $duration;
                        $results{$src}{$dst}{$type}->{'protocol'} = $protocol;
                        $results{$src}{$dst}{$type}->{'src_average'} = $src_average;
                        $results{$src}{$dst}{$type}->{'dst_average'} = $dst_average;
                        $results{$src}{$dst}{$type}->{'src_min'} = $src_min;
                        $results{$src}{$dst}{$type}->{'dst_min'} = $dst_min;
                        $results{$src}{$dst}{$type}->{'src_max'} = $src_max;
                        $results{$src}{$dst}{$type}->{'dst_max'} = $dst_max;
                        $results{$src}{$dst}{$type}->{'bidirectional'} = $bidirectional;

                    delete $results{$dst}{$src} if !%{$results{$dst}{$src}};
                    delete $results{$dst} if !%{$results{$dst}};

                }
            }
        }
    }

    # invert src/dst if dst is one of the local addresses
    if (1) {
        while (my ($src, $values) = each %results) {
            while (my ($dst, $types) = each %$values) {
                if ( exists $addresses->{ $dst } ) {
                    my $orig_src = $src;
                    my $orig_dst = $dst;
                    $src = $dst;
                    $dst = $orig_src;
                    $results{$src}{$dst} = $results{$orig_src}{$orig_dst};
                    delete $results{$orig_src}{$orig_dst};
                    # if $results{$orig_src} is empty, delete it
                    if ( !%{  $results{$orig_src} } ) {
                        delete $results{$orig_src};
                    }
                    if ( $orig_src ne $src ) {
                        foreach my $type (@$all_types) {
                            while ( my ( $key, $val ) = each %{ $results{$src}{$dst}{$type} } ) {
                                my $orig_key = $key;

                                # only replace if we're looking at a src_ key
                                if ( $key =~ /^src_/ ) {
                                    $key =~ s/^src_/dst_/;
                                } 
                                # if the key has been renamed
                                if ( $orig_key ne $key ) {
                                    # make a copy of the value stored under the new key
                                    my $tmp = $results{$src}{$dst}{$type}{$key};

                                    # copy the value from the old key to the new key
                                    $results{$src}{$dst}{$type}{$key} = $results{$src}{$dst}{$type}{$orig_key};
                                    # copy the value from the new key to the old key
                                    $results{$src}{$dst}{$type}{$orig_key} = $tmp;
                                }

                            }
                        }
                    }

                }
            }
        }
    }

    # FLATTEN DATASTRUCTURE
    my @results_arr;
    if ($flatten == 1) {
        while (my ($src, $values) = each %results) {
            while (my ($dst, $types) = each %$values) {
                my $row = {};
                foreach my $type (@$all_types) {
                    while (my ($key, $value) = each %{$results{$src}{$dst}{$type}}) {
                        $row->{"${type}_$key"} = $value;
                    }
                    $row->{'source_ip'} = $src;
                    $row->{'destination_ip'} = $dst;
                    # TODO: optimize this (reduce the number of DNS calls)
                    my $hostnames = host_info( {src => $src, dest => $dst} );
                    my $source_host = $hostnames->{source_host};
                    my $destination_host = $hostnames->{dest_host};
                    $row->{'source_host'} = $source_host;
                    $row->{'destination_host'} = $destination_host;
                }
                push @results_arr, $row;
            }
        }

    }

    print $cgi->header('text/json');
    if ($flatten == 1) {
        print to_json(\@results_arr);
    } else {
        print to_json(\%results);
    }

}

sub get_ls_hosts {
    print $cgi->header('text/json');
    my @ls_hosts = map { $_->{locator} } @{discover_lookup_services()};
    print to_json(\@ls_hosts);

}

sub get_interfaces {
    my @sources     = cgi_multi_param('source');
    my @dests       = cgi_multi_param('dest');
    my @ipversions  = cgi_multi_param('ipversion');
    my $ls_url      = $cgi->param('ls_url')    || error("Missing required parameter \"ls_url\"");


    if ( !is_ip_or_hostname( {address => \@sources} ) ) {
        error("Invalid source ip address specified", 400);
    }
    if ( !is_ip_or_hostname( {address => \@dests} ) ) {
        error("Invalid destination ip address specified", 400);
    }

    if ( !is_web_url( { address => $ls_url} ) ) {
        error("Invalid LS URL specified", 400);
    }

    my @results;

    for (my $i = 0; $i < @sources; $i++){
        my $source = $sources[$i];
        my $dest   = $dests[$i];
        my $ipversion   = $ipversions[$i];

        my $server = SimpleLookupService::Client::SimpleLS->new();
        $server->setUrl($ls_url);
        $server->connect();

        my $query_object = SimpleLookupService::QueryObjects::Network::InterfaceQueryObject->new();
        $query_object->init();

        my $host_info       = host_info( { src => $source, dest => $dest, ipversion => $ipversion });
        my $source_hostname = $host_info->{'source_host'};
        my $dest_hostname   = $host_info->{'dest_host'};
        my @source_ips = ();
        my @dest_ips = ();
        my @ifaddrs = (); 

        @source_ips = split ',', $host_info->{'source_ip'} if($host_info->{'source_ip'});
        @dest_ips = split ',', $host_info->{'dest_ip'} if($host_info->{'dest_ip'});

        # If source and dest are provided, query both. Otherwise only query source
        if ($source && $dest) {
            push @ifaddrs, @source_ips;
            push @ifaddrs,  @dest_ips;
            push @ifaddrs, $source_hostname;
            push @ifaddrs, $dest_hostname;
        }
        elsif ($source) {
            push @ifaddrs, @source_ips;
            push @ifaddrs, $source_hostname;
        }
        $query_object->setInterfaceAddresses( \@ifaddrs );

        $query_object->setKeyOperator( { key => 'interface-addresses', operator => 'any' } );

        my $query = new SimpleLookupService::Client::Query;
        $query->init( { server => $server } );

        my ($resCode, $result) = $query->query( $query_object );

        my $capacity = 0;
        my $mtu = 0;
        my %source_ip_map = map { $_ => 1 } @source_ips;
        my %dest_ip_map = map { $_ => 1 } @dest_ips;

        if ( $resCode == -1 ) {
            error("Error: " . $result->{'message'});
        }

        foreach my $res (@$result) {
            $capacity = $res->getInterfaceCapacity()->[0] unless !$res->getInterfaceCapacity();
            $mtu      = $res->getInterfaceMTU()->[0] unless !$res->getInterfaceMTU();

            my $addresses = $res->getInterfaceAddresses();
            foreach my $address (@$addresses) {
                if ( $source_ip_map{$address} || $address eq $source_hostname) {
                    push(@results, {'source_capacity'  => $capacity,
                            'source_mtu'       => $mtu,
                            'source_ip'        => $source,
                            'source_addresses' => $addresses
                        }
                    );
                }
                elsif ($dest && $dest_ip_map{$address} || $address eq $dest_hostname) {
                    push(@results, {'dest_capacity'  => $capacity,
                            'dest_mtu'       => $mtu,
                            'dest_ip'        => $dest,
                            'dest_addresses' => $addresses
                        }
                    );

                }
            }
        }
    }

    print $cgi->header('text/json');
    print to_json(\@results);

}

sub get_host_info {
    my @sources    = cgi_multi_param('src');
    my @dests      = cgi_multi_param('dest');
    my @ipversions = cgi_multi_param('ipversion');

    # check for invalid sources
    if ( !is_ip_or_hostname( {address => \@sources} ) ) {
        error("Invalid ip address specified", 400);
    }
    # check for invalid destinations
    if ( !is_ip_or_hostname( {address => \@dests} ) ) {
        error("Invalid ip address specified", 400);
    }

    my @all_results;

    for (my $i = 0; $i < @sources; $i++){
	my $results = host_info( { src => $sources[$i], dest => $dests[$i], ipversion => $ipversions[$i] } );
	push(@all_results, $results);
    }

    print $cgi->header('text/json');
    print to_json(\@all_results);
}

sub host_info {
    my $parameters = validate( @_, { src => 1, dest => 1, ipversion => 0 });
    my $src       = $parameters->{src};
    my $dest      = $parameters->{dest};
    my $ipversion      = $parameters->{ipversion};

# Create a new object with just source and dest (in case other parameters are passed that we don't want)
    my $hosts = {};
    $hosts->{'source'} = $src;
    $hosts->{'dest'} = $dest;

    my $results  = {};

    while (my ($key, $host) =  each %$hosts) {
        next if !$host || $host eq '';
        # if $host is IP address, do DNS lookup
        if (is_ipv4($host) || is_ipv6($host)) {
            $results->{$key . '_ip'} = $host;
	
	    if(exists($dns_cache{$host . ' '. 'name'})){
                $results->{$key . '_host'} = $dns_cache{$host . ' '. 'name'}[0];
            }
            else{
                my ( @names ) = reverse_dns( $host, 1 );
                $dns_cache{$host . ' '. 'name'} = [@names];
                $results->{$key . '_host'} = $names[0];
            }
	                      

        } else {
            $results->{$key . '_host'} = $host;
            $results->{$key . '_ip'} = '';
            
	    my @addresses;
            if(exists($dns_cache{$host})){
                @addresses = @{$dns_cache{$host}};
            }
            else{
                @addresses = resolve_address($host);
                $dns_cache{$host} = [@addresses];
            }
            
	    my $ip_count = 0;
            foreach my $address(@addresses){
                if($ipversion && $ipversion == 4){
                    next unless(is_ipv4($address));
                    $results->{$key . '_ip'} .= $address;
                    last;
                }elsif($ipversion && $ipversion == 6){
                    next unless(is_ipv6($address));
                    $results->{$key . '_ip'} .= $address;
                    last;
                }else{
                    $results->{$key . '_ip'} .= ',' if($ip_count);
                    $results->{$key . '_ip'} .= $address;
                    $ip_count++;
                }
            }
        }
    }

    return $results;
}


sub error {
    my $err = shift;
    my $error_code = shift || 500; # 500 is general purpose Internal Server Error

    print $cgi->header( -type=>'text/plain', -status=> $error_code );
    print $err;

    exit 1;
}

