#!/usr/bin/perl

use strict;

use FindBin qw($RealBin);

use lib ("$RealBin/../lib");
use JSON;
use CGI qw(:standard);
use HTML::Entities;
use perfSONAR_PS::Utils::GraphMetadataKey qw(lookupGraphKeys);

#Get parameters
my $cgi       = new CGI;
my $srcRaw    = HTML::Entities::encode(param("srcRaw"));
my $dstRaw    = HTML::Entities::encode(param("dstRaw"));
my $eventType = HTML::Entities::encode(param("eventType"));
my $ma_url    = HTML::Entities::encode(param("ma_url"));
my $parameters = {};
$parameters->{"protocol"}     = HTML::Entities::encode(param("protocol"));
$parameters->{"timeDuration"} = HTML::Entities::encode(param("timeDuration"));
$parameters->{"count"}     = HTML::Entities::encode(param("count"));
$parameters->{"bucket_width"} = HTML::Entities::encode(param("bucket_width"));

#get keys
my $resultHash = lookupGraphKeys($srcRaw, $dstRaw, $eventType, $ma_url, $parameters);

#Print as JSON
my $json = new JSON;
my $json_result;
my $json_text =
  $json->pretty->allow_blessed->allow_nonref->allow_unknown->encode(
    $resultHash );
print "\n", $json_text;

