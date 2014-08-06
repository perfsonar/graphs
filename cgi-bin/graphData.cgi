#!/usr/bin/perl

use strict;
use warnings;

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

use Log::Log4perl qw(get_logger :easy :levels);

#use lib "$FindBin::Bin/../../../../lib";
use lib "$FindBin::RealBin/../lib";

use perfSONAR_PS::Client::Esmond::ApiFilters;
use perfSONAR_PS::Client::Esmond::ApiConnect;

# Lookup Service libraries
use SimpleLookupService::Client::SimpleLS;
use perfSONAR_PS::Client::LS::PSRecords::PSService;
use perfSONAR_PS::Client::LS::PSRecords::PSInterface;
use SimpleLookupService::Client::Bootstrap;
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
    my @valid_windows = (60, 300, 3600, 86400);
    $summary_window = 3600;
    $summary_window = $window if ($window && (grep {$_ eq $window} @valid_windows));

    my @urls    = $cgi->param('url');     
    my @sources = $cgi->param('src');     
    my @dests   = $cgi->param('dest');    
    my $start   = $cgi->param('start')   || error("Missing required parameter \"start\"");
    my $end     = $cgi->param('end')     || error("Missing required parameter \"end\"");

    if (@sources == 0 || @sources != @dests || @sources != @urls){
	error("There must be an equal non-zero amount of src, dest, and url options passed.");
    }

    my @base_event_types   = ('throughput', 'histogram-owdelay', 'packet-loss-rate', 'packet-retransmits');
    my @mapped_event_types = ('throughput', 'owdelay', 'loss', 'packet_retransmits');

    my $flatten = 1;
    $flatten = $cgi->param('flatten') if (defined $cgi->param('flatten'));

    my %results;

    for (my $i = 0; $i < @base_event_types; $i++){
        my $event_type = $base_event_types[$i];

        for (my $j = 0; $j < @sources; $j++){
            foreach my $ordered ([$sources[$j], $dests[$j]], [$dests[$j], $sources[$j]]){
                my ($test_src, $test_dest) = @$ordered;

                my $filter = new perfSONAR_PS::Client::Esmond::ApiFilters();
                $filter->event_type($event_type);
                $filter->source($test_src);
                $filter->destination($test_dest);

                my $client = new perfSONAR_PS::Client::Esmond::ApiConnect(url     => $urls[$j],
                    filters => $filter);

                my $metadata = $client->get_metadata();

                error($client->error) if ($client->error);

                my @data_points;

                foreach my $metadatum (@$metadata){
                    my $event = $metadatum->get_event_type($event_type);
                    $event->filters->time_start($start);
                    $event->filters->time_end($end);
                    my $source_host = $metadatum->input_source();
                    my $destination_host = $metadatum->input_destination();
                    my $tool_name = $metadatum->tool_name();

                    # we MAY want to skip bwctl/ping results
                    # for now, we are. comment out or remove to skip them.
                    next if ($tool_name eq 'bwctl/ping');

                    my $data;
                    my $total = 0;
                    my $average;
                    my $min = undef;
                    my $max = undef; 


                    if ($event_type eq 'histogram-owdelay') {
                        my $stats_summ = $event->get_summary('statistics', $summary_window);
                        error($event->error) if ($event->error);
                        $data = $stats_summ->get_data() if defined $stats_summ;
                        if (defined($data) && @$data > 0){
                            foreach my $datum (@$data){
                                $total += $datum->val->{mean};
                                $max = $datum->val->{maximum} if !defined($max) || $datum->val->{maximum} > $max;
                                $min = $datum->val->{minimum} if !defined($min) || $datum->val->{minimum} < $min;
                            }
                            $average = $total / @$data;
                        }
                    } 
                    else {
                        if ($event_type eq 'packet-loss-rate') {
                            my $stats_summ = $event->get_summary('aggregation', $summary_window);
                            error($event->error) if ($event->error);
                            $data = $stats_summ->get_data() if defined $stats_summ;
                        } 
                        else {
                            $data = $event->get_data();
                        }
                        if (defined($data) && @$data > 0){
                            foreach my $datum (@$data){
                                $total += $datum->val;
                                $max = $datum->val if !defined($max) || $datum->val > $max;
                                $min = $datum->val if !defined($min) || $datum->val < $min;
                            }
                            $average = $total / @$data;
                        }
                    }

                    my @data_points = ();
                    foreach my $datum (@$data){
                        my $ts = $datum->ts;
                        my $val;
                        if ($event_type eq 'histogram-owdelay') {
                            $val = $datum->{val}->{mean};
                        }
                        else {    
                            $val = $datum->val;
                        }
                        push(@data_points, {'ts' => $ts, 'val' => $val});		    
                    }

                    # Figure out how to map into prettier names that don't reveal
                    # underlying constructs			    	    		   
                    my $remapped_name = $mapped_event_types[$i];
           
                   if (exists($results{$test_src}{$test_dest}{$remapped_name}) &&  @{$results{$test_src}{$test_dest}{$remapped_name}} > 0) { 
                        my @existing_data_points = @{$results{$test_src}{$test_dest}{$remapped_name}};
                        @data_points = (@existing_data_points, @data_points);
                    }
                    $results{$test_src}{$test_dest}{$remapped_name} = \@data_points if @data_points > 0; 
                }
            }
        }
    }

    # CONSOLIDATE BIDIRECTIONAL TESTS
    my %consolidated;

    while (my ($src, $values) = each %results) {
        while (my ($dst, $result_types) = each %$values) {

            foreach my $type (@mapped_event_types) {

                $consolidated{$src}{$dst}{$type} ||= [];

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
                elsif (exists $results{$dst}{$src}{$type} && $dst_was_orig_src){
                    $data_set   = $results{$dst}{$src}{$type};
                    $key_prefix = "dst";		    
                }

                next unless ($data_set);

                foreach my $data (@$data_set) {
                    my $row = {};

                    while (my ($key, $val) = each %$data) {
                        $row->{$key_prefix . "_" . $key} = $val;
                    }

                    push @{$consolidated{$src}{$dst}{$type}}, $row;		    

                }

            }
        }
    }


    # FLATTEN DATASTRUCTURE

    my @flattened;

    while (my ($src, $values) = each %consolidated){
        while (my ($dst, $val_types) = each %$values) {

            foreach my $type (@mapped_event_types) {

                foreach my $value (@{$consolidated{$src}{$dst}{$type}}) {

                    my $row = {};

                    # Iterate over ALL types in the request
                    foreach my $all_type (@mapped_event_types) {
                        $row->{$all_type . '_src_val'} = undef;
                        $row->{$all_type . '_dst_val'} = undef;
                    }

                    my $ts  = $value->{'src_ts'};
                    my $val = $value->{'src_val'};

                    $row->{$type . "_src_val"} = $val;
                    $row->{'ts'}      = $ts;
                    $row->{'ts_date'} = localtime($ts) if $ts;

                    my $dst_ts  = $value->{'dst_ts'};
                    my $dst_val = $value->{'dst_val'};

                    $row->{$type . "_dst_val"} = $dst_val;
                    $row->{'ts'}      = $dst_ts if defined $dst_ts;
                    $row->{'ts_date'} = localtime($dst_ts) if $dst_ts;

                    $row->{'source'}      = $src;
                    $row->{'destination'} = $dst;

                    push @flattened, $row;
                }
            }
        }
    }

    print $cgi->header('text/json');

    if ($flatten == 1) { 
        # This section consolidates based on same timestamp
        # It may be good to try to make adjustments to better display stray points
        # Sort by ts
        @flattened = sort by_ts @flattened;
        my $last_ts = 0;            
        for(my $i = 0; $i < @flattened; $i++) {
            my $row  = $flattened[$i];
            if ($row->{ts} <= $last_ts) {
                $flattened[$i-1] = combine_data($row, $flattened[$i-1]);
                splice(@flattened, $i, 1);
                $i--;

            }
            $last_ts = $row->{ts};

        }
        print to_json(\@flattened);
    } 
    else {
        print to_json(\%consolidated);
    }
}


sub get_tests {
    my $url    = $cgi->param('url')   || error("Missing required parameter \"url\"");
    my $flatten = 1;
    $flatten = $cgi->param('flatten') if (defined $cgi->param('flatten'));
    my $start_time = [Time::HiRes::gettimeofday()];

    my $filter = new perfSONAR_PS::Client::Esmond::ApiFilters();
   
    my $client = new perfSONAR_PS::Client::Esmond::ApiConnect(url     => $url,
							      filters => $filter);
    
    my $total_metadata = 0;
    my $method_start_time = [Time::HiRes::gettimeofday()];
    $start_time = [Time::HiRes::gettimeofday()];
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
        my $hostnames = host_info( {src => $src, dest => $dst} );
        my $source_host = $hostnames->{source_host};
        my $destination_host = $hostnames->{dest_host};
        my $source_ip = $hostnames->{source_ip};
        my $destination_ip = $hostnames->{dest_ip};

        foreach my $event_type (@$event_types){

            my $type        = $event_type->event_type();
            my $last_update = $event_type->time_updated(); 


            # TEMP HACK
            next unless ($type eq 'throughput' || $type eq 'packet-loss-rate' || $type eq 'histogram-owdelay');

            $type = 'loss' if ($type eq 'packet-loss-rate');
            $type = 'owdelay' if ($type eq 'histogram-owdelay');

            # now grab the last 1 weeks worth of data to generate a high level view
            $event_type->filters->time_start($now - 86400 * 7);
            $event_type->filters->time_end($now);
            $event_type->filters->source($src);
            $event_type->filters->destination($dst);

            $start_time = [Time::HiRes::gettimeofday()];
            my $data;
            my $total = 0;
            my $average;
            my $min = undef;
            my $max = undef;

            if ($type eq 'owdelay') {
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
                    src          => $src,
                    dst           => $dst,
                    source_host  => $source_host,
                    destination_host => $destination_host,
                    source_ip => $source_ip,
                    destination_ip => $destination_ip,
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
                        $source_host = $src_res->{'source_host'};
                        $destination_host = $src_res->{'destination_host'};

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
                        $source_host = $dst_res->{'destination_host'}; 
                        $destination_host = $dst_res->{'source_host'};
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
                        $results{$src}{$dst}{$type}->{'source_host'} = $source_host;
                        $results{$src}{$dst}{$type}->{'destination_host'} = $destination_host;
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
                    $row->{'source'} = $src;
                    $row->{'destination'} = $dst;
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
    my %hosts;

    my %results;
    my $ls_bootstrap_client = SimpleLookupService::Client::Bootstrap->new();
    $ls_bootstrap_client->init();
    my $urls = $ls_bootstrap_client->query_urls();

    print $cgi->header('text/json');
    print to_json($urls);

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

    my $ip_regex ='^((?-xism::(?::[0-9a-fA-F]{1,4}){0,5}(?:(?::[0-9a-fA-F]{1,4}){1,2}|:(?:(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})))|[0-9a-fA-F]{1,4}:(?:[0-9a-fA-F]{1,4}:(?:[0-9a-fA-F]{1,4}:(?:[0-9a-fA-F]{1,4}:(?:[0-9a-fA-F]{1,4}:(?:[0-9a-fA-F]{1,4}:(?:[0-9a-fA-F]{1,4}:(?:[0-9a-fA-F]{1,4}|:)|(?::(?:[0-9a-fA-F]{1,4})?|(?:(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2}))))|:(?:(?:(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2}))|[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})?|))|(?::(?:(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2}))|:[0-9a-fA-F]{1,4}(?::(?:(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2}))|(?::[0-9a-fA-F]{1,4}){0,2})|:))|(?:(?::[0-9a-fA-F]{1,4}){0,2}(?::(?:(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2}))|(?::[0-9a-fA-F]{1,4}){1,2})|:))|(?:(?::[0-9a-fA-F]{1,4}){0,3}(?::(?:(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2}))|(?::[0-9a-fA-F]{1,4}){1,2})|:))|(?:(?::[0-9a-fA-F]{1,4}){0,4}(?::(?:(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2}))|(?::[0-9a-fA-F]{1,4}){1,2})|:))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2}))))$';

    my $results  = {};

    while (my ($key, $host) =  each %$hosts) {
        # if $host is IP address, do DNS lookup
        if ($host =~ /$ip_regex/) { 
            $results->{$key . '_ip'} = $host;
            my $host_addr = inet_aton($host); 
            $results->{$key . '_host'} = gethostbyaddr($host_addr, AF_INET);
        } else {
            $results->{$key . '_host'} = $host;
            #$results->{$key . '_ip'} = inet_ntoa(inet_aton(gethostbyname($host))); #   or die "Can't resolve $name: $!\n";
            $results->{$key . '_ip'} = inet_ntoa(inet_aton($host)); #   or die "Can't resolve $name: $!\n";
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

sub by_ts {
    $a->{ts} <=> $b->{ts};
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
