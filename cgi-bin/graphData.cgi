#!/usr/bin/perl

use strict;
use warnings;

use threads;
use threads::shared;

use CGI;
use Config::General;
use JSON;
use LWP::UserAgent;
use HTTP::Request;
use Params::Validate qw(:all);
use JSON qw(from_json);
use FindBin;
use Time::HiRes;
use Data::Dumper;
use Socket;
use Socket qw( AF_INET AF_INET6 );
use Socket6;
use Data::Validate::IP;
use Log::Log4perl qw(get_logger :easy :levels);

#use lib "$FindBin::Bin/../../../../lib";
use lib "$FindBin::RealBin/../lib";

use perfSONAR_PS::Client::Esmond::ApiFilters;
use perfSONAR_PS::Client::Esmond::ApiConnect;

# Lookup Service libraries
use SimpleLookupService::Client::SimpleLS;
use perfSONAR_PS::Client::LS::PSRecords::PSService;
use perfSONAR_PS::Client::LS::PSRecords::PSInterface;
use perfSONAR_PS::Utils::LookupService qw(discover_lookup_services);
use SimpleLookupService::Client::Query;
use SimpleLookupService::QueryObjects::Network::InterfaceQueryObject;

my $basedir = "$FindBin::Bin";

my $cgi = new CGI;

my $action = $cgi->param('action') || error("Missing required parameter \"action\", must specify data or tests");

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
else {
    error("Unknown action \"$action\", must specify either data, tests, hosts, or interfaces");
}

sub get_data {

    my $summary_window;
    my $window = $cgi->param('window');
    my @valid_windows = (0, 60, 300, 3600, 86400);
    $summary_window = 3600;
    $summary_window = $window if (defined($window) && (grep {$_ eq $window} @valid_windows));

    my @urls        = $cgi->param('url');     
    my @sources     = $cgi->param('src');     
    my @dests       = $cgi->param('dest');    
    my @ipversions  = $cgi->param('ipversion');
    my @agents      = $cgi->param('agent');
    my @tools       = $cgi->param('tool');
    my @protocols   = $cgi->param('protocol');
    my @filters     = $cgi->param('filter');

    my $start       = $cgi->param('start')   || error("Missing required parameter \"start\"");
    my $end         = $cgi->param('end')     || error("Missing required parameter \"end\"");

    if (@sources == 0 || @sources != @dests || @sources != @urls){
	error("There must be an equal non-zero amount of src, dest, and url options passed.");
    }

    my @base_event_types   = ('throughput', 'histogram-owdelay', 'packet-loss-rate', 'packet-retransmits', 'histogram-rtt', 'failures');
    my @mapped_event_types = ('throughput', 'owdelay', 'loss', 'packet_retransmits', 'ping', 'errors', 'owdelay_minimum', 'owdelay_median', 'ping_minimum', 'ping_maximum', 'error', 'error_tool');

    my %results;
    my %types_to_ignore = ();

    share(%types_to_ignore);

    my @threads;

    for (my $j = 0; $j < @sources; $j++){
	foreach my $ordered ([$sources[$j], $dests[$j]], [$dests[$j], $sources[$j]]){
	    my ($test_src, $test_dest) = @$ordered;
	    
	    my $thread = threads->create(\&_get_test_data,
					 $test_src,
					 $test_dest,
					 $start,
					 $end,
					 $summary_window,
					 $urls[$j],
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
	}
    }
    
    foreach my $thread (@threads){
	my $ret_array = $thread->join();
	error("Error fetching data") if (! $ret_array);		

	foreach my $ret (@$ret_array){

	    my $test_src        = $ret->{'test_src'};
	    my $test_dest       = $ret->{'test_dest'};
	    my $multiple_values = $ret->{'multiple_values'};
	    my $remapped_name   = $ret->{'remapped_name'};
	    my @data_points     = @{$ret->{'data'}};
	    my @summary_fields  = @{$ret->{'summary_fields'}};
	    my %additional_data = %{$ret->{'additional_data'}};
	    
	    
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

                my $src_was_orig_src = grep {$_ eq $src} @sources;
                my $dst_was_orig_src = grep {$_ eq $dst} @sources;

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
    $filter->source($test_src);
    $filter->destination($test_dest);
    $filter->measurement_agent($agent) if($agent);
    $filter->tool_name($tool) if($tool);
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
	warn $client->error;
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
            }
            else {
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
    my $url    = $cgi->param('url')   || error("Missing required parameter \"url\"");
    my $source    = $cgi->param('source')   || error("Missing required parameter \"url\"");
    my $dest    = $cgi->param('dest')   || error("Missing required parameter \"url\"");

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

# get_test_list is used to retrieve just the hostname/ips of source and destination
# of active tests in an MA. 
sub get_test_list {
    my $url    = $cgi->param('url')   || error("Missing required parameter \"url\"");

    my $filter = new perfSONAR_PS::Client::Esmond::ApiFilters(); 
    $filter->time_range( 86400*31 );
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
    my $start_time = $now - 86400 * 7;
    my $metadata_out = [];

    HOSTS: foreach my $metadatum (@$metadata) {
        push @$metadata_out, $metadatum->{data};
        $hosts{ $metadatum->{'data'}->{'source'} } = 1;
        $hosts{ $metadatum->{'data'}->{'destination'} } = 1;
        foreach my $event_type (@{$metadatum->{'data'}->{'event-types'}}) {
            if (defined ($event_type->{'time-updated'}) && $event_type->{'time-updated'} > $start_time ) {
                my $source = $metadatum->{'data'}->{'source'};
                my $dest = $metadatum->{'data'}->{'destination'};
                $active_hosts{ $source } = 1;
                my $hostnames = host_info( {src => $source, dest => $dest} );
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
    my $url    = $cgi->param('url')   || error("Missing required parameter \"url\"");
    my $flatten = 1;
    $flatten = $cgi->param('flatten') if (defined $cgi->param('flatten'));

    my $show_details = 0;
    my $start_time = [Time::HiRes::gettimeofday()];

    my $filter = new perfSONAR_PS::Client::Esmond::ApiFilters();
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

    my $summary_window = 3600; # try 0 or 86400

    my $now = time;
    my $total_data = 0;
    my $all_types = [];

    foreach my $metadatum (@$metadata){

        my $src = $metadatum->source();
        my $dst = $metadatum->destination();

        my $event_types = $metadatum->get_all_event_types();

        my $protocol = $metadatum->get_field('ip-transport-protocol');
        my $duration = $metadatum->get_field('time-duration');
        my $source_ip = $src;
        my $destination_ip = $dst;

        foreach my $event_type (@$event_types){

            my $type        = $event_type->event_type();
            my $last_update = $event_type->time_updated(); 

            # TEMP HACK
            next unless ($type eq 'throughput' || $type eq 'packet-loss-rate' || $type eq 'histogram-owdelay');

            $type = 'loss' if ($type eq 'packet-loss-rate');
            $type = 'owdelay' if ($type eq 'histogram-owdelay');

            # now grab the last 1 weeks worth of data to generate a high level view
            my $start_time = $now - 86400 * 7;
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
            if ($type eq 'owdelay') {
                if ($show_details || 1) {
                    my $stats_summ = $event_type->get_summary('statistics', $summary_window);
                    error($event_type->error) if ($event_type->error);
                    $data = $stats_summ->get_data() if defined $stats_summ;
                    if (defined($data) && @$data > 0){
                        push @$all_types, $type if (!grep {$_ eq $type} @$all_types);
                        foreach my $datum (@$data){
                            $total += $datum->val->{mean};
                            $max = $datum->val->{maximum} if !defined($max) || $datum->val->{maximum} > $max;
                            $min = $datum->val->{minimum} if !defined($min) || $datum->val->{minimum} < $min;
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
                    my $stats_summ = $event_type->get_summary('aggregation', $summary_window);
                    error($event_type->error) if ($event_type->error);
                    $data = $stats_summ->get_data() if defined $stats_summ;
                } else {
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
                    week_average => $average,
                    week_min     => $min,
                    week_max     => $max,
                    duration     => $duration,
                    protocol     => $protocol,
                    bidirectional => 0};
            }
        }
    }

    # CONSOLIDATE BIDIRECTIONAL TESTS
    if (1) {
        while (my ($src, $values) = each %results) {
            while (my ($dst, $types) = each %$values) {
                foreach my $type (@$all_types) {
                    my $bidirectional = 0;
                    my ($src_res, $src_average, $src_min, $src_max, $source_host);
                    my ($dst_res, $dst_average, $dst_min, $dst_max, $destination_host);
                    my ($average, $min, $max, $duration, $last_update, $protocol);
                    if (exists($results{$src}{$dst}{$type})) {
                        $src_res = $results{$src}{$dst}{$type};
                        $src_average = $src_res->{'week_average'};
                        $src_min = $src_res->{'week_min'};
                        $src_max = $src_res->{'week_max'};
                        $protocol = $src_res->{'protocol'};

                    }
                    if (exists($results{$dst}{$src}{$type})) {
                        $dst_res = $results{$dst}{$src}{$type};
                        $average = undef;
                        $dst_average = $dst_res->{'week_average'};
                        $dst_min = $dst_res->{'week_min'};
                        $dst_max = $dst_res->{'week_max'};

                        $min = $dst_res->{'week_min'};
                        $max = $dst_res->{'week_max'};
                        $duration = $dst_res->{'duration'};
                        $last_update = $dst_res->{'last_update'} || 0;
                        $protocol = $dst_res->{'protocol'};
                        $bidirectional = 1 if (defined ($results{$dst}{$src}{$type}->{'week_average'}) && defined ($results{$src}{$dst}{$type}->{'week_average'}) );

                        # Now combine with the source values
                        $min = $src_res->{'week_min'} if (defined($src_res->{'week_min'}) && (!defined($min) || $src_res->{'week_min'} < $min));
                        $max = $src_res->{'week_max'} if (defined($src_res->{'week_max'}) && (!defined($max) || $src_res->{'week_max'} > $max));

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
                        $results{$src}{$dst}{$type}->{'week_max'} = $max;
                        $results{$src}{$dst}{$type}->{'week_min'} = $min;
                        $results{$src}{$dst}{$type}->{'week_average'} = $average;
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
    my @sources     = $cgi->param('source');
    my @dests       = $cgi->param('dest'); 
    my $ls_url      = $cgi->param('ls_url')    || error("Missing required parameter \"ls_url\"");

    my @results;    

    for (my $i = 0; $i < @sources; $i++){
	my $source = $sources[$i];
	my $dest   = $dests[$i];
				
	my $server = SimpleLookupService::Client::SimpleLS->new();
	$server->setUrl($ls_url);
	$server->connect();
	
	my $query_object = SimpleLookupService::QueryObjects::Network::InterfaceQueryObject->new();
	$query_object->init();
	
	my $host_info       = host_info( { src => $source, dest => $dest });
	my $source_hostname = $host_info->{'source_host'};
	my $dest_hostname   = $host_info->{'dest_host'};
	
	# If source and dest are provided, query both. Otherwise only query source
	if ($source && $dest) {
	    $query_object->setInterfaceAddresses( [ $source, $dest, $source_hostname, $dest_hostname ] );
	} 
	elsif ($source) { 
	    $query_object->setInterfaceAddresses( [ $source, $source_hostname ] );
	}

	$query_object->setKeyOperator( { key => 'interface-addresses', operator => 'any' } );
	
	my $query = new SimpleLookupService::Client::Query;
	$query->init( { server => $server } );
	
	my ($resCode, $result) = $query->query( $query_object );
	
	my $capacity = 0;
	my $mtu = 0;

	foreach my $res (@$result) {
    	$capacity = $res->getInterfaceCapacity()->[0] unless !$res->getInterfaceCapacity();
    	$mtu      = $res->getInterfaceMTU()->[0] unless !$res->getInterfaceMTU();

	    my $addresses = $res->getInterfaceAddresses();
        foreach my $address (@$addresses) {
            if ($address eq $source || $address eq $source_hostname) {
                push(@results, {'source_capacity'  => $capacity,
                        'source_mtu'       => $mtu,
                        'source_ip'        => $source,
                        'source_addresses' => $addresses
                    }
                );
            } 
            elsif ($dest && $address eq $dest || $address eq $dest_hostname) {
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
    my @sources   = $cgi->param('src');  
    my @dests     = $cgi->param('dest'); 

    my @all_results;
   
    for (my $i = 0; $i < @sources; $i++){
	my $results = host_info( { src => $sources[$i], dest => $dests[$i] } );	
	push(@all_results, $results);
    }  

    print $cgi->header('text/json');
    print to_json(\@all_results);
}

sub host_info {
    my $parameters = validate( @_, { src => 1, dest => 1 });
    my $src       = $parameters->{src};
    my $dest      = $parameters->{dest};

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
            my ($err, @addrs) = getaddrinfo( $host, 0 );
            my ( @names) = getnameinfo( $addrs[2] );
            $results->{$key . '_host'} = $names[0];
        } else {            
            $results->{$key . '_host'} = $host;            
            my $err = '';
            my ( @addrs ) = getaddrinfo( $host, 0 );
            my $hostout2;
            my $addr = $addrs[0];
            $hostout2 = '';
            my $hostout  = getnameinfo( $addr, NI_NUMERICHOST );
            my $address;
            if ($addrs[3]) {
            if ($addrs[0] == AF_INET) {
                $address = (unpack_sockaddr_in($addrs[3]))[1]
            } else {
                $address = (unpack_sockaddr_in6($addrs[3]))[1]
            }
            } else {
                $address = '';
            }
            $hostout2 = inet_ntop($addrs[0], $address);
            $results->{$key . '_ip'} = $hostout2;
        }
    }

    return $results;
}


sub error {
    my $err = shift;

    print $cgi->header('text/plain');
    print $err;

    exit 1;
}

sub select_summary_window {
    my $event_type = shift;
    my $summary_type = shift;
    my $window = shift;
    my $event = shift;

    my $ret_window = -1;
    my $next_smallest_window = -1;
    my $next_largest_window = -1;
    my $summaries = $event->{data}->{summaries};
    my $exact_match = 0;
    foreach my $summary (@$summaries) {
        if ($summary->{'summary-type'} eq $summary_type && $summary->{'summary-window'} == $window) {
            $ret_window = $window;
            $exact_match = 1;
            last;
        } elsif ($summary->{'summary-window'} < $window && $summary->{'summary-window'} > $next_smallest_window) {
            $next_smallest_window = $summary->{'summary-window'};
        } elsif ($next_largest_window == -1 || ($summary->{'summary-window'} > $window && $summary->{'summary-window'} < $next_largest_window)) {
           $next_largest_window = $summary->{'summary-window'};
        } 
    }
    # if the requested window is 0 (base data) and we don't have a match,
    # this means we need to return -1 so the calling code can use base data instead
    if ($window == 0 && !$exact_match) {
        $ret_window = -1;
    } else {
        # if there's no exact match, accept the closest lower value
        $ret_window = $next_smallest_window if ($ret_window == -1 && !$exact_match);
        # if there's no lower value, take the closest larger value
        $ret_window = $next_largest_window if ($ret_window == -1 && !$exact_match);
    }   
    return $ret_window;

}

sub combine_data {
    my $data1 = shift;
    my $data2 = shift;
    my $combined = {};

    while (my ($key, $val) = each %$data1) {
        $combined->{$key} = $val;
    }

    while (my ($key, $val) = each %$data2) {
        if(defined($val)) {
            $combined->{$key} = $val;
        }
    }
    return $combined;
}
