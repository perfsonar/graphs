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

use Log::Log4perl qw(get_logger :easy :levels);

#use lib "$FindBin::Bin/../../../../lib";
use lib "$FindBin::RealBin/../lib";

use perfSONAR_PS::Client::Esmond::ApiFilters;
use perfSONAR_PS::Client::Esmond::ApiConnect;

my $basedir = "$FindBin::Bin";

# my $config_file = $basedir . '/etc/web_admin.conf';
# my $conf_obj    = Config::General->new( -ConfigFile => $config_file );

# our %conf = $conf_obj->getall;

# if ($conf{logger_conf}) {
#     unless ( $conf{logger_conf} =~ /^\// ) {
#         $conf{logger_conf} = $basedir . "/etc/" . $conf{logger_conf};
#     }    
#     Log::Log4perl->init( $conf{logger_conf} );
# }
# else {
#     # If they've not specified a logger, send it all to /dev/null
#     Log::Log4perl->easy_init( { level => $DEBUG, file => "/dev/null" } );
# }

# our $logger = get_logger( "perfSONAR_PS::WebGUI::ServiceTest::graphData" );
# if ( $conf{debug} ) {
#     $logger->level( $DEBUG );
# }

my $cgi = new CGI;

my $action = $cgi->param('action') || error("Missing required parameter \"action\", must specify data or tests");

if ($action eq 'data'){
    get_data();
}
elsif ($action eq 'tests'){
    get_tests();
}
else {
    error("Unknown action \"$action\", must specify either data or tests");
}

sub get_data {
    my @types  = $cgi->param('type');
    #error("Missing required parameter \"type\"") if (! @types);
    if (! @types) {
        @types = ('throughput', 'histogram-owdelay', 'packet-loss-rate', 'packet-retransmits');
        #my @types = ('throughput');
        #my @types = ('histogram-owdelay');
        #my @types = ('packet-loss-rate');
    }
    my $summary_window;
    my $window = $cgi->param('window');
    my @valid_windows = (60, 300, 3600, 86400);
    $summary_window = 3600;
    $summary_window = $window if ($window && (grep {$_ eq $window} @valid_windows));
    #warn "Summary window: ${summary_window}; window: $window";

    my $url     = $cgi->param('url')     || error("Missing required parameter \"url\"");
    my $src     = $cgi->param('src')     || error("Missing required parameter \"src\"");
    my $dest    = $cgi->param('dest')    || error("Missing required parameter \"dest\"");
    my $start   = $cgi->param('start')   || error("Missing required parameter \"start\"");
    my $end     = $cgi->param('end')     || error("Missing required parameter \"end\"");
    my $flatten = 1;
    $flatten = $cgi->param('flatten') if (defined $cgi->param('flatten'));

    my %results;
    
    foreach my $type (@types){
        my $real_type = $type;	
        foreach my $ordered ([$src, $dest], [$dest, $src]){

            my ($test_src, $test_dest) = @$ordered;

            my $filter = new perfSONAR_PS::Client::Esmond::ApiFilters();
            $filter->event_type($type);
            $filter->source($test_src);
            $filter->destination($test_dest);

            my $client = new perfSONAR_PS::Client::Esmond::ApiConnect(url     => $url,
                filters => $filter);

            my $metadata = $client->get_metadata();

            error($client->error) if ($client->error);

            my @data_points;

            #print "I found " . @$metadata . " points\n";

            foreach my $metadatum (@$metadata){
                my $event = $metadatum->get_event_type($real_type);
                #warn "Type: $type";
                $event->filters->time_start($start);
                $event->filters->time_end($end);

                $type = 'loss' if ($type eq 'packet-loss-rate');
                $type = 'owdelay' if ($type eq 'histogram-owdelay');
                $type = 'packet_retransmits' if ($type eq 'packet-retransmits');

                my $data;
                my $total = 0;
                my $average;
                my $min = undef;
                my $max = undef; 

                if ($type eq 'owdelay') {
                    #$data = $event_type->get_data();
                    my $stats_summ = $event->get_summary('statistics', $summary_window);
                    error($event->error) if ($event->error);
                    #warn "No $type summary found\n" unless $stats_summ;
                    $data = $stats_summ->get_data() if defined $stats_summ;
                    #warn "stats_data: " . Dumper $data;
                    if (defined($data) && @$data > 0){
                        foreach my $datum (@$data){
                            $total += $datum->val->{mean};
                            $max = $datum->val->{maximum} if !defined($max) || $datum->val->{maximum} > $max;
                            $min = $datum->val->{minimum} if !defined($min) || $datum->val->{minimum} < $min;
                        }
                        $average = $total / @$data;
                    }
                } else {
                    if ($type eq 'loss') {
                        my $stats_summ = $event->get_summary('aggregation', $summary_window);
                        error($event->error) if ($event->error);
                        #warn "No $type summary found\n" unless $stats_summ;
                        $data = $stats_summ->get_data() if defined $stats_summ;
                    } else {
                        #warn "event: " . Dumper $event;
                        $data = $event->get_data();
                        #warn "data: " . Dumper $data;
                        #error($event->error) if ($event->error);
                    }
                    #warn "data: " . Dumper $data;
                    if (defined($data) && @$data > 0){
                        foreach my $datum (@$data){
                            $total += $datum->val;
                            $max = $datum->val if !defined($max) || $datum->val > $max;
                            $min = $datum->val if !defined($min) || $datum->val < $min;
                        }
                        $average = $total / @$data;
                    }
                } 

                #my $data  = $event->get_data();

                #error($event->error) if($event->error); 

                #print all data
                #warn "not here!";
                foreach my $datum (@$data){
                    my $ts = $datum->ts;
                    my $val;
                    if ($type eq 'owdelay') {
                        $val = $datum->{val}->{mean};
                    } else {    
                        $val = $datum->val;
                    }
                    push(@data_points, {'ts' => $ts, 'val' => $val});		    
                }
            }
            #warn "$type data_points: " . @data_points;
            $results{$test_src}{$test_dest}{$type} = \@data_points;
        }
    }

    # CONSOLIDATE BIDIRECTIONAL TESTS
    my %res = ();
    if (1) {
        while (my ($src, $values) = each %results) {
            while (my ($dst, $result_types) = each %$values) {
                #warn "src: $src and dst: $dst\n";
                while (my $type = each %$result_types) {
                    #warn "type: " . $type;
                    $res{$src}{$dst}{$type} = ();
                    #if (exists $results{$src}{$dst}{$type}) {
                        foreach my $data (@{$results{$src}{$dst}{$type}}) {
                            my $row = {};

                            while (my ($key, $val) = each %$data) {
                                $row->{'src_'.$key} = $val;
                                #push @{$results{$src}{$dst}{$type}}, \%row;
                            }
                            push @{$res{$src}{$dst}{$type}}, $row;
                        }
                        #}
                    if (exists($results{$dst}{$src}{$type})) {
                        foreach my $data (@{$results{$dst}{$src}{$type}}) {
                            #warn "got here dst src";
                            my $row = {};
                            while (my ($key, $val) = each %$data) {
                                $row->{'dst_'.$key} = $val;
                            }
                            #warn Dumper $row;
                            push @{$res{$src}{$dst}{$type}}, $row;
                        }
                    } 

                }
            }
        }
        %results = ();
        %results = %res;
    }
    

    # FLATTEN DATASTRUCTURE

    my @results_arr;
    my $results2 = {};
    my $results_arr2 = [];
    #my $min_ts;
    #my $max_ts;
    if ($flatten == 1) {
        while (my ($src, $values) = each %results) {
            while (my ($dst, $types) = each %$values) {
                #warn "src: $src and dst: $dst\n";
                while (my $type = each %$types) { 
                    $results_arr2 = [];
                    $results2->{$type} = [];
                    foreach my $value (@{$results{$src}{$dst}{$type}}) {
                        my $row = {};
                        #my $min_ts = $ts if (!defined($min_ts) || $ts < $min_ts);
                        #my $max_ts = $ts if (!defined($max_ts) || $ts > $max_ts);

                            # Iterate over ALL types in the request
                            foreach my $all_type (@types) {
                                #warn "type (full): " . $all_type;
                                $row->{$all_type.'_src_val'} = undef;
                                $row->{$all_type.'_dst_val'} = undef;

                            }
                        my $ts = $value->{src_ts};
                        my $val = $value->{src_val};
                        if (defined($ts) && defined($val) || 1) {
                            $row->{"${type}_src_ts"} = $ts;
                            $row->{"${type}_src_val"} = $val;
                            $row->{ts} = $ts;
                            $row->{ts_date} = localtime($ts) if $ts;
                        }

                        my $dst_ts = $value->{dst_ts};
                        my $dst_val = $value->{dst_val};
                        if (defined($dst_ts) && defined($dst_val) || 1) {
                            $row->{"${type}_dst_ts"} = $dst_ts;
                            $row->{"${type}_dst_val"} = $dst_val;
                            $row->{ts} = $dst_ts if defined $dst_ts;
                            $row->{ts_date} = localtime($dst_ts) if $dst_ts;
                        }
                        $row->{'source'} = $src;
                        $row->{'destination'} = $dst;
                        #$row->{'type'} = $type;
                        #$results2{$type} = $row;
                        push @results_arr, $row;
                        push @$results_arr2, $row;
                        push @{$results2->{$type}}, $row;
                    }
                    #warn "results_arr2 ${type}: " . Dumper $results_arr2;
                    #$results2->{$type} = $results_arr2;
                }
            }
        }

    }

    print $cgi->header('text/json');
    if ($flatten == 1) {
        print to_json(\@results_arr);
        #print to_json($results2);
    } else {
        print to_json(\%results);
    }
}


sub get_tests {
    my $url    = $cgi->param('url')   || error("Missing required parameter \"url\"");
    my $flatten = 1;
    $flatten = $cgi->param('flatten') if (defined $cgi->param('flatten'));
    #my $flatten    = $cgi->param('flatten') || 1;
    my $start_time = [Time::HiRes::gettimeofday()];

    my $filter = new perfSONAR_PS::Client::Esmond::ApiFilters();
   
    my $client = new perfSONAR_PS::Client::Esmond::ApiConnect(url     => $url,
							      filters => $filter);
    
    my $total_metadata = 0;
    my $method_start_time = [Time::HiRes::gettimeofday()];
    $start_time = [Time::HiRes::gettimeofday()];
    my $metadata = $client->get_metadata();
    warn "Time elapsed getting metadata: " . Time::HiRes::tv_interval($start_time);
    $total_metadata += Time::HiRes::tv_interval($start_time);
    error($client->error) if ($client->error);

    my %results;

    my $summary_window = 86400; # try 0 or 86400

    my $now = time;
    my $total_data = 0;

    foreach my $metadatum (@$metadata){

        my $src = $metadatum->source();
        my $dst = $metadatum->destination();

        my $event_types = $metadatum->get_all_event_types();

        my $protocol = $metadatum->get_field('ip-transport-protocol');
        my $duration = $metadatum->get_field('time-duration');
        #my $source_host = $metadatum->get_field('input-source');
        #my $destination_host = $metadatum->get_field('input-destination');
        my $source_host = $metadatum->input_source();
        my $destination_host = $metadatum->input_destination();

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

            $start_time = [Time::HiRes::gettimeofday()];
            my $data;
            my $total = 0;
            my $average;
            my $min = undef;
            my $max = undef;

            if ($type eq 'owdelay') {
                #$data = $event_type->get_data();
                my $stats_summ = $event_type->get_summary('statistics', $summary_window);
                error($event_type->error) if ($event_type->error);
                #warn "No $type summary found\n" unless $stats_summ;
                $data = $stats_summ->get_data() if defined $stats_summ;
                #warn "stats_data: " . Dumper $data;
                if (@$data > 0){
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
                    #warn "No $type summary found\n" unless $stats_summ;
                    $data = $stats_summ->get_data() if defined $stats_summ;
                } else {
                    $data = $event_type->get_data();
                }
                if (@$data > 0){
                    foreach my $datum (@$data){
                        $total += $datum->val;
                        $max = $datum->val if !defined($max) || $datum->val > $max;
                        $min = $datum->val if !defined($min) || $datum->val < $min;
                    }
                    $average = $total / @$data;
                }
            }
            $total_data += Time::HiRes::tv_interval($start_time);
            warn "Time elapsed getting data: " . Time::HiRes::tv_interval($start_time);

            error($event_type->error) if ($event_type->error);

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
                bidirectional => 0};
        }
    }

    # CONSOLIDATE BIDIRECTIONAL TESTS
    if (1) {
        while (my ($src, $values) = each %results) {
            while (my ($dst, $types) = each %$values) {
                #warn "src: $src and dst: $dst\n";
                while (my $type = each %$types) { #{$results{$dst}{$src}}) {
                    my $bidirectional = 0;
                    if (exists($results{$dst}{$src}{$type})) {
                        my $dst_res = $results{$dst}{$src}{$type};
                        my $src_res = $results{$src}{$dst}{$type};
                        my $average = undef; # = $dst_res->{'week_average'};# || 0;
                        my $dst_average = $dst_res->{'week_average'};
                        my $src_average = $src_res->{'week_average'};
                        my $dst_min = $dst_res->{'week_min'};
                        my $src_min = $src_res->{'week_min'};
                        my $dst_max = $dst_res->{'week_max'};
                        my $src_max = $src_res->{'week_max'};

                        my $min = $dst_res->{'week_min'};
                        my $max = $dst_res->{'week_max'};
                        my $duration = $dst_res->{'duration'};
                        my $last_update = $dst_res->{'last_update'} || 0;
                        my $protocol = $dst_res->{'protocol'};
                        #warn "src_res: " . Dumper $src_res;
                        #warn "dst_res: " . Dumper $dst_res;
                        my $source_host = $src_res->{'source_host'};
                        my $destination_host = $src_res->{'destination_host'};
                        $bidirectional = 1 if (defined ($results{$dst}{$src}{$type}->{'week_average'}) && defined ($results{$src}{$dst}{$type}->{'week_average'}) );

                    # Now combine with the source values
                    $min = $src_res->{'week_min'} if (defined($src_res->{'week_min'}) && $src_res->{'week_min'} < $min);
                    #warn "src_res min: " . $src_res->{'week_min'};
                    #warn "src_res max: " . $src_res->{'week_max'};
                    $max = $src_res->{'week_max'} if (defined($src_res->{'week_max'}) &&  $src_res->{'week_max'} > $max);

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

                    delete $results{$dst}{$src}{$type};
                }
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
            #warn "src: $src and dst: $dst\n";
            my $row = {};
            while (my $type = each %$types) { #{$results{$dst}{$src}}) {
                #my $row = {};
                while (my ($key, $value) = each %{$results{$src}{$dst}{$type}}) {
                    #if ($key ne 'source_host' && $key ne 'destination_host') {
                    $row->{"${type}_$key"} = $value;
                    #} else {
                    #$row->{$key} = $value;
                    #}
                    #$row->{$key} = $value;
                }

                $row->{'source'} = $src;
                $row->{'destination'} = $dst;
                #$row->{'type'} = $type;
                #$row->{'source_host'} = $results{$src}{$dst}{$type}->{'source_host'};
                #$row->{'destination_host'} = $results{$src}{$dst}{$type}->{'destination_host'};
            }
            push @results_arr, $row;
        }
    }

}
#    my @results_arr;
#    while (my ($source, $destination, $type) = each %results) {
#        my %row = $results{$source}{$destination}{$type};
#        $row{'source'} = $source;
#        $row{'destination'} = $destination;
#        $row{'type'} = $type;
#        
#        push @results_arr, %row;
#    }
warn "Total metadata time (s): $total_metadata\n";
warn "Total data time (s): $total_data\n";
warn "Total time: " . Time::HiRes::tv_interval($method_start_time);

print $cgi->header('text/json');
if ($flatten == 1) {
    print to_json(\@results_arr);
} else {
    print to_json(\%results);
}

}

sub error {
    my $err = shift;

    print $cgi->header('text/plain');
    print $err;

    exit 1;
}



