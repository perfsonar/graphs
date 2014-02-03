#!/usr/bin/perl
use strict;

use FindBin qw($RealBin);

#include perfsonar library
use lib ("$RealBin/../lib");
use YAML::Syck;
use Template;
use CGI qw(:standard);
use HTML::Entities;

#print cgi-header
my $cgi = new CGI;
print $cgi->header;

my $basedir     = "$RealBin/";
my $templatedir = "$basedir/../templates";
my $configdir   = "$basedir/../etc";

my $configfile = "$configdir/config.yml";
my $string;

my $eventType = param("eventType");
my $ma_url    = param("ma_url");      # adding option to query MA directly
my $ma_host_type    = param("ma_host_type");

$eventType = "owamp" unless ($eventType);

$configfile = "$configdir/config_$eventType.yml";

#displays html form based on config parameters

unless ( -e $configfile ) {
    my $html = errorPage("Configuration not found.");
    print $html;
    exit(1);
}

#set variables - service, hostname
$string = YAML::Syck::LoadFile($configfile);

my %hostlist;
if ( defined $ma_url and defined $eventType ) {
    $hostlist{"$ma_url"} = $ma_url;
}else {
    %hostlist = %{ $string->{'hosts'} };
}
my %servicetypes       = %{ $string->{'services'} };
my %serviceDisplayName = %{ $string->{'serviceDisplayName'} };
my $serviceCount       = scalar keys %servicetypes;
my $hostCount          = scalar keys %hostlist;

my @tests = ();
if ( defined @{ %{$string}->{'groups'} } ) {
    @tests = @{ %{$string}->{'groups'} };
}

my %vars = (
    services           => HTML::Entities::encode(\%servicetypes),
    hosts              => HTML::Entities::encode(\%hostlist),
    eventType          => HTML::Entities::encode($eventType),
    serviceDisplayName => HTML::Entities::encode(\%serviceDisplayName),
    );
if ( scalar @tests >= 1 ) {
    $vars{groups} = \@tests;
}

if(defined $ma_host_type){
	$vars{ma_host_type} = HTML::Entities::encode($ma_host_type)

}else{
	$vars{ma_host_type}="";	
}

#open template
my $tt = Template->new( INCLUDE_PATH => "$templatedir" )
  or die("Couldn't initialize template toolkit");
my $html;
$tt->process( "serviceTest.tmpl", \%vars, \$html ) or die $tt->error();
print $html;

exit 0;

sub errorPage {
    my ($msg) = @_;

    my $tt = Template->new( INCLUDE_PATH => "$templatedir" )
      or die("Couldn't initialize template toolkit");

    my $html;

    my %vars = ();
    $vars{error_msg} = HTML::Entities::encode($msg);

    $tt->process( "serviceTest_error.tmpl", \%vars, \$html )
      or die $tt->error();

    return $html;
}
