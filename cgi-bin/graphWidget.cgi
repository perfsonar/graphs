#!/usr/bin/perl

# graphWidget.cgi: a webservice that takes parameters for source, destination,
# and MA, and returns HTML/CSS/JS for a chart widget

use strict;
use warnings;

use FindBin qw($RealBin);

#include perfsonar library
use lib ("$RealBin/../lib");
use Template;
use CGI qw(:standard);
use HTML::Entities;
use perfSONAR_PS::Web::Sidebar qw(set_sidebar_vars);
use perfSONAR_PS::Utils::Host qw( is_ip_or_hostname );
use Data::Dumper;
use JSON qw( encode_json to_json );

my $basedir     = "$RealBin/";
my $templatedir = "$basedir/../templates";
my $configdir   = "$basedir/../etc";

my $cgi = new CGI;

my @ma_urls          = $cgi->param("url");      # adding option to query MA directly
my @sources          = $cgi->param("source");
my @dests            = $cgi->param("dest");
my @ipversions       = $cgi->param('ipversion');
my @agents           = $cgi->param('agent');
my @tools            = $cgi->param('tool');
my @protocols        = $cgi->param('protocol');
my @filters          = $cgi->param('filter');
my $window           = $cgi->param('window');

if ( !is_ip_or_hostname( {address => \@sources} ) ) {
    error("Invalid source ip address specified", 400);
}

if ( !is_ip_or_hostname( {address => \@dests} ) ) {
    error("Invalid destination ip address specified", 400);
}

if ( @agents && !is_ip_or_hostname( {address => \@agents, required => 0} ) ) {
    error("Invalid measurement agent ip address specified", 400);
}

if ( $window && $window !~ /^\d+$/ ) {
    error("Invalid summary window specified", 400);
}

if ( @ipversions ) {
    foreach my $version ( @ipversions ) {
        if ( $version !~ /^\d$/ ) {
            error("Invalid IP version specified", 400);
        }
    }
}

@tools = encode_js( \@tools );

@protocols = encode_js( \@protocols );

@filters = encode_js( \@filters );

handle_esmond();

sub encode_js {
    my $arrayref = shift;
    my @array = @$arrayref;

    my @array_quoted = ();
    foreach my $value (@array) {
        next if $value eq '';
        push @array_quoted, to_json( $value, { allow_nonref => 1 } );
    }
    return @array_quoted;

}

sub handle_esmond {
    print $cgi->header;

    my %vars = (
	sources             => \@sources,
	dests               => \@dests,
	window              => $window,
	ipversions           => \@ipversions,
	agents              => \@agents,
	tools               => \@tools,
	protocols           => \@protocols,
	filters             => \@filters,
	);

    #open template
    my $tt = Template->new( INCLUDE_PATH => "$templatedir" )
	or die("Couldn't initialize template toolkit");

    my $html;
    $tt->process( "graphWidget.tmpl", \%vars, \$html ) or die $tt->error();
    print $html;
}

sub error {
    my $err = shift;
    my $error_code = shift || 500; # 500 is general purpose Internal Server Error

    print $cgi->header( -type=>'text/plain', -status=> $error_code );
    print $err;

    exit 1;
}

sub errorPage {
    my ($msg) = @_;

    my $tt = Template->new( INCLUDE_PATH => "$templatedir" )
	or die("Couldn't initialize template toolkit");

    my $html;

    my %vars = ();
    $vars{error_msg} = HTML::Entities::encode($msg);

    set_sidebar_vars( { vars => \%vars } );

    $tt->process( "serviceTest_error.tmpl", \%vars, \$html )
	or die $tt->error();

    return $html;
}



