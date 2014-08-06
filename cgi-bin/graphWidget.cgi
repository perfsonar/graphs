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
use Data::Dumper;
use JSON;
use perfSONAR_PS::Utils::GraphMetadataKey qw(lookupGraphKeys);

my $basedir     = "$RealBin/";
my $templatedir = "$basedir/../templates";
my $configdir   = "$basedir/../etc";

my $cgi = new CGI;

my @ma_urls          = $cgi->param("url");      # adding option to query MA directly
my @sources          = $cgi->param("source");
my @dests            = $cgi->param("dest");
my $window           = $cgi->param('window');

# If we're handling a request to an old MA
# figure out where it needs to go
if ($ma_urls[0] =~ /pSB/){
    handle_old_ma();
}
else {
    handle_esmond();
}


sub handle_old_ma {
    # we need to do some guesswork here to figure out which event they were trying to
    # view, either throughput or delay

    # it looks like bucket_width parameter only shows up for delay tests so
    # use that to tentatively guess where to emit the redirect

    my $cgi_url   = $cgi->url();
    my $query_str = $cgi->query_string();

    if ($cgi->param('bucket_width')){
	$cgi_url =~ s/graphWidget\.cgi/delayGraph\.cgi/;
    }
    else {
	$cgi_url =~ s/graphWidget\.cgi/bandwidthGraph\.cgi/;
    }

    print $cgi->redirect($cgi_url . "?" . $query_str);    
}

sub handle_esmond {
    #print cgi-header
    print $cgi->header;
    
    my %vars = (
	sources             => \@sources,
	dests               => \@dests,
	window              => $window
	);
    
    #open template
    my $tt = Template->new( INCLUDE_PATH => "$templatedir" )
	or die("Couldn't initialize template toolkit");
    
    my $html;
    $tt->process( "graphWidget.tmpl", \%vars, \$html ) or die $tt->error();
    print $html;
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



