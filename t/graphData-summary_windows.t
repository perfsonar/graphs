#!/usr/bin/perl -w
# This test verifies the summary window selection

use strict;
use warnings;
use FindBin qw($Bin);
use lib "$Bin/lib";
use lib "$Bin/../lib";
use Log::Log4perl qw(:easy);
Log::Log4perl->easy_init( {level => 'OFF'} );

use Test::More tests => 3;

use Data::Dumper;

#use perfSONAR_PS::NPToolkit::UnitTests::Util qw( test_result );
use perfSONAR_PS::Graphs::Functions qw(select_summary_window combine_data);

my $expected_window = 86401; # TODO: FIX

my $summaries = _get_summaries();

my $selected_window = select_summary_window('packet-loss-rate', 'aggregation', 86400, $summaries );

is( $expected_window, $selected_window, "Got expected summary window back (exact match)" );

# Test situation where a summary window that doesn't exist is requested, falling back to next lowest existing window
$expected_window = 3600;
$selected_window = select_summary_window('packet-loss-rate', 'aggregation', 3700, $summaries );
is( $expected_window, $selected_window, "Got expected summary window back (inexact match)" );

# Test summary window of 0 (base data)
$expected_window = -1;
$selected_window = select_summary_window('packet-loss-rate', 'aggregation', 0, $summaries );
is( $expected_window, $selected_window, "Got expected summary window back (base data)" );


sub _get_summaries {

#event type: packet-loss-rate; summary_type: aggregation; window: 86400; event:
    my $summaries = {
        'url' => 'https://perfsonar-dev8.grnoc.iu.edu/esmond/perfsonar/archive/',
        'filters' => bless( {
                'metadata_filters' => {
                    'source' => '140.182.49.103',
                    'destination' => '140.182.49.164',
                    'subject-type' => 'point-to-point'

                },
                'time_filters' => {
                    'time-end' => 1497886963,
                    'time-range' => '604800',
                    'time-start' => 1497282163
                },
                'timeout' => 60
            }, 'perfSONAR_PS::Client::Esmond::ApiFilters' ),
        'data' => {
            'base-uri' => '/esmond/perfsonar/archive/f213bd554bba4ac59d99b5f211788341/packet-loss-rate/base',

            'event-type' => 'packet-loss-rate',
            'time-updated' => 1497886952,
            'summaries' => [
                {
                    'summary-type' => 'aggregation',
                    'summary-window' => '300',
                    'time-updated' => 1497886952,
                    'uri' => '/esmond/perfsonar/archive/f213bd554bba4ac59d99b5f211788341/packet-loss-rate/aggregations/300'

                },
                {
                    'summary-type' => 'aggregation',
                    'summary-window' => '3600',
                    'time-updated' => 1497886952,
                    'uri' => '/esmond/perfsonar/archive/f213bd554bba4ac59d99b5f211788341/packet-loss-rate/aggregations/3600'

                },
                {
                    'summary-type' => 'aggregation',
                    'summary-window' => '86400',
                    'time-updated' => 1497886952,
                    'uri' => '/esmond/perfsonar/archive/f213bd554bba4ac59d99b5f211788341/packet-loss-rate/aggregations/86400'
                }
            ]
        }
    };
    return $summaries;
}
