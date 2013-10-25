#!/usr/bin/perl

use strict;

use FindBin qw($RealBin);

use lib ("$RealBin/../lib");
use Statistics::Descriptive;
use Data::Validate::IP qw(is_ipv4 is_ipv6);
use XML::LibXML;
use Socket;
use JSON;
use CGI qw(:standard);
use HTML::Entities;

use perfSONAR_PS::Client::MA;
use perfSONAR_PS::Utils::DNS qw(resolve_address reverse_dns);

my $cgi       = new CGI;
my $srcRaw    = HTML::Entities::encode(param("srcRaw"));
my $dstRaw    = HTML::Entities::encode(param("dstRaw"));
my $eventType = HTML::Entities::encode(param("eventType"));
my $ma_url    = HTML::Entities::encode(param("ma_url"));
my %parameters;
my %resultHash;
my $maKeyHash;
my $maKey;
my $maKeyR;

#Get IP address or host names whichever is missing
my $src;
my $dst;
my $srcIP;
my $dstIP;
if ( get_endpoint_type($srcRaw) ne "hostname" ) {
    $src = reverse_dns($srcRaw);
    $srcIP = $srcRaw;
}
else {
    my @ips = resolve_address($srcRaw);
    my $ip  = @ips[0];

    $src   = $srcRaw;
    $srcIP = $ip;
}

$src = $srcRaw unless $src;
$srcIP = $srcIP unless $srcIP;
#convert ipv6 to short form
$srcIP =~ s/(:0+)+:/::/g;

#do the above for dst also
if ( get_endpoint_type($dstRaw) ne "hostname" ) {
    $dst = reverse_dns($dstRaw);
    $dstIP = $dstRaw;
}
else {
    my @ips = resolve_address($dstRaw);
    my $ip  = @ips[0];

    $dst   = $dstRaw;
    $dstIP = $ip;
}

$dst = $dstRaw unless $dst;
$dstIP = $dstRaw unless $dst;
#convert ipv6 to short form
$dstIP =~ s/(:0+)+:/::/g;

if (   $eventType eq "http://ggf.org/ns/nmwg/tools/iperf/2.0"
    or $eventType eq
    "http://ggf.org/ns/nmwg/characteristics/bandwidth/achievable/2.0" )
{

    $parameters{"protocol"}     = param("protocol");
    $parameters{"timeDuration"} = param("timeDuration");
    if ( $parameters{"protocol"} eq "" || $parameters{"timeDuration"} eq "" ) {
        print "Error";
    }
    else {
        $resultHash{"protocol"}     = $parameters{"protocol"};
        $resultHash{"timeDuration"} = $parameters{"timeDuration"};
        $maKeyHash  = getData( $ma_url, $eventType, $src, $srcIP, $dst,$dstIP, \%parameters );

    }

}
elsif (
    $eventType eq "http://ggf.org/ns/nmwg/characteristic/delay/summary/20070921"
    or $eventType eq "http://ggf.org/ns/nmwg/tools/owamp/2.0"
    or $eventType eq
    "http://ggf.org/ns/nmwg/characteristic/delay/summary/20110317" )
{

    #Currently, does not use schedule parameter
    $parameters{"count"}        = param("count");
    $parameters{"bucket_width"} = param("bucket_width");
    if ( $parameters{"bucket_width"} eq "" || $parameters{"count"} eq "" ) {
        print "Error";
    }
    else {
        $resultHash{"count"}        = $parameters{"count"};
        $resultHash{"bucket_width"} = $parameters{"bucket_width"};
        $maKeyHash  = getData( $ma_url, $eventType, $src, $srcIP, $dst, $dstIP, \%parameters );
    }


}


my $maKey="";
my $maKeyR="";
foreach my $key( keys %{$maKeyHash}){
        if($maKeyHash->{$key}{"src"} eq $src){
		if($maKey eq ""){
			$maKey .= $maKeyHash->{$key}{"maKey"};
		}else{
			$maKey .= "_".$maKeyHash->{$key}{"maKey"};
		}
	}elsif($maKeyHash->{$key}{"src"} eq $dst){
	        if($maKeyR eq ""){
                        $maKeyR .= $maKeyHash->{$key}{"maKey"};
                }else{
                        $maKeyR .= "_".$maKeyHash->{$key}{"maKey"};
                }

	}
}


#format result and convert to JSON before returning it
$resultHash{"srcIP"}     = $srcIP;
$resultHash{"dstIP"}     = $dstIP;
$resultHash{"maKey"}     = "$maKey";
$resultHash{"maKeyR"}    = "$maKeyR";
$resultHash{"ma_url"}    = "$ma_url";
$resultHash{"eventType"} = "$eventType";
$resultHash{"src"}       = $src;
$resultHash{"dst"}       = $dst;

my $json = new JSON;
my $json_result;

my $json_text =
  $json->pretty->allow_blessed->allow_nonref->allow_unknown->encode(
    \%resultHash );

print "\n", $json_text;

# getData()
# function getData begins. This function retrieves maKeys or data for owamp and bwctl data
# Arguments - MA URL, eventType, src IP , dst IP and a refernece to parameters
# Returns the metadataKey
sub getData() {

    my %resultHash;

    #get the input values
    my ( $ma_url, $eventType, $src, $srcIP, $dst, $dstIP, $parameterHash ) = @_;

    my $start = time - 24 * 60 * 60;
    my $end   = time;

    # Create client
    my $ma = new perfSONAR_PS::Client::MA( { instance => $ma_url } );

    # Define a subject
    my $subject;

    if (   $eventType eq "http://ggf.org/ns/nmwg/tools/iperf/2.0"
        or $eventType eq
        "http://ggf.org/ns/nmwg/characteristics/bandwidth/achievable/2.0" )
    {
        $subject =
"<iperf:subject xmlns:iperf= \"http://ggf.org/ns/nmwg/tools/iperf/2.0/\" id=\"s-in-iperf-1\">\n";
        $subject .=
"  <nmwgt:endPointPair xmlns:nmwgt=\"http://ggf.org/ns/nmwg/topology/2.0/\"/>\n";
       # $subject .=
        #    "    <nmwgt:src value=\"$srcIP\" />\n";
        #$subject .=
         #   "    <nmwgt:dst value=\"$dstIP\" />\n";
        #$subject .= "  </nmwgt:endPointPair>\n";
        $subject .= "</iperf:subject>\n";
    }
    elsif ( $eventType eq
           "http://ggf.org/ns/nmwg/characteristic/delay/summary/20070921"
        or $eventType eq "http://ggf.org/ns/nmwg/tools/owamp/2.0"
        or $eventType eq
        "http://ggf.org/ns/nmwg/characteristic/delay/summary/20110317" )
    {
        $subject =
"<owamp:subject xmlns:owamp=\"http://ggf.org/ns/nmwg/tools/owamp/2.0/\" id=\"subject-1\">\n";
        $subject .=
"  <nmwgt:endPointPair xmlns:nmwgt=\"http://ggf.org/ns/nmwg/topology/2.0/\"/>\n";
       # $subject .=
        #    "    <nmwgt:src value=\"$srcIP\" />\n";
        #$subject .=
        #    "    <nmwgt:dst value=\"$dstIP\" />\n";
        #$subject .= "  </nmwgt:endPointPair>\n";
        $subject .= "</owamp:subject>\n";
    }

    # Set the eventType
    my @eventTypes = ($eventType);

    my $result = $ma->metadataKeyRequest(
        {
            subject    => $subject,
            eventTypes => \@eventTypes,
            start      => $start,
            end        => $end,
            parameters => $parameterHash
        }
    ) or die("Error contacting MA");

   my %tmpHash=();
    foreach my $metadata(@{$result->{metadata}}){
	my $parser = XML::LibXML->new(ext_ent_handler => sub { return ""; });
        my $doc;
        eval { $doc = $parser->parse_string($metadata); };
        if ($@) {
            die("Error parsing MA response");
        }
        my $root = $doc->getDocumentElement;
	my $testSrc = "".$root->find(".//*[local-name()='src']/\@value");
	my $testDst = "".$root->find(".//*[local-name()='dst']/\@value");
	my $id = $root->find("\@id");
	#print "\n $id, $testSrc, $testDst";
	if(($testSrc eq "$src" || $testSrc eq "$srcIP") && ($testDst eq "$dst" || $testDst eq "$dstIP" )){
		$tmpHash{$id}{"src"} = $src;
		$tmpHash{$id}{"srcIP"} = $srcIP;
		$tmpHash{$id}{"dst"} = $dst;
		$tmpHash{$id}{"dstIP"} = $dstIP;
	}elsif(($testSrc eq "$dst" || $testSrc eq "$dstIP") && ($testDst eq "$src" || $testDst eq "$srcIP" )){
                $tmpHash{$id}{"dst"} = $src;
                $tmpHash{$id}{"dstIP"} = $srcIP;
                $tmpHash{$id}{"src"} = $dst;
                $tmpHash{$id}{"srcIP"} = $dstIP;
	}

    }
    foreach my $data ( @{ $result->{data} } ) {
        my $parser = XML::LibXML->new();
        my $doc;
        eval { $doc = $parser->parse_string($data); };
        if ($@) {
            die("Error parsing MA response");
        }
        my $root = $doc->getDocumentElement;
	my $id = $root->find("\@metadataIdRef");
        my $tmpKey = $root->find(".//*[local-name()='parameter'][\@name='maKey']");
     	if(defined $tmpHash{$id}){
		$tmpHash{$id}{"maKey"}=$tmpKey; 
	}
    }
    return \%tmpHash;
}

#function to determine host id type - hostname, ipv4, ipv6
sub get_endpoint_type() {
    my $endpoint = shift @_;
    my $type     = "hostname";

    if ( is_ipv4($endpoint) ) {
        $type = "ipv4";
    }
    elsif ( is_ipv6($endpoint) ) {
        $type = "ipv6";
    }

    return $type;
}
