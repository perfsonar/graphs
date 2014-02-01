#!/usr/bin/perl  

use strict;

use FindBin qw($RealBin);

use lib ("$RealBin/../lib");
use Statistics::Descriptive;
use XML::LibXML;
use Socket;
use JSON;
use CGI qw(:standard);
use Data::Validate::IP qw(is_ipv4 is_ipv6);
use perfSONAR_PS::Client::MA;
use perfSONAR_PS::Utils::DNS qw(resolve_address reverse_dns);
use HTML::Entities;

my %bwctlEventType = (
			"http://ggf.org/ns/nmwg/tools/iperf/2.0" => 1,
			"http://ggf.org/ns/nmwg/characteristics/bandwidth/achievable/2.0"  => 1
);

my %owampEventType = (
			"http://ggf.org/ns/nmwg/characteristic/delay/summary/20070921" => 1,
			"http://ggf.org/ns/nmwg/tools/owamp/2.0"  => 1,
			"http://ggf.org/ns/nmwg/characteristic/delay/summary/20110317"  => 1
);

my $cgi       = new CGI;
my $ma_url    = HTML::Entities::encode(param("ma_url"));
my $eventType = HTML::Entities::encode(param("eventType"));
my $ma_host_type = HTML::Entities::encode(param("ma_host_type"));

unless ( $ma_url and $eventType ) {
    print $cgi->header;
    print "<h1>Missing parameters!!!! Please supply event and Ma_URL to contact</h1>";
    exit -1;
}

my $resultHash = getData( $ma_url, $eventType );

if (!defined $resultHash){
	print $cgi->header;
    print "<h1>Error processing request. Please check if MA is functioning correctly</h1>";
    exit -1;
}

#separate into active and inactive datasets
my $activeDataSets   = ();
my $inactiveDataSets = ();
my %chkHash=();

my $commonElement = "";
my $count=0;

foreach my $key ( keys %{$resultHash} ) {
	#To eliminate duplicates
    if (exists $bwctlEventType{$eventType}){
        my $newkey ="$resultHash->{$key}{\"srcIP\"}-$resultHash->{$key}{\"dstIP\"}-$resultHash->{$key}{\"protocol\"}-$resultHash->{$key}{\"timeDuration\"}";
            
	    #check for duplicates
	    if($activeDataSets->{$newkey}){#entry exists in active test
		if($resultHash->{$key}{data}{active} eq "Yes"){
			my $newnr = $resultHash->{$key}{data}{throughput}*$resultHash->{$key}{data}{datapoints}+$activeDataSets->{$newkey}->{data}{throughput}*$activeDataSets->{$newkey}->{data}{datapoints};
			my $newdr = $activeDataSets->{$newkey}->{data}{datapoints}+$resultHash->{$key}{data}{datapoints};
			if($newdr > 0){
				$activeDataSets->{$newkey}->{data}{throughput} = $newnr/$newdr;
			}else{
				$activeDataSets->{$newkey}->{data}{throughput} = $newnr;
			}
	    		
			$activeDataSets->{$newkey}->{data}{datapoints}= $newdr;
		}
		#ignore inactive test if there is an active duplicate test
	    }elsif($inactiveDataSets->{$newkey}){ #entry exists inactive tests
		if($resultHash->{$key}{data}{active} eq "Yes"){
			delete $inactiveDataSets->{$newkey};
	    		$activeDataSets->{$newkey} = \%{ $resultHash->{$key} };
	        }
		# ignore inactive test if there is an inactive duplicate test
            }else{#new test
		if($resultHash->{$key}{data}{active} eq "Yes"){
			$activeDataSets->{$newkey} = \%{ $resultHash->{$key} };
	    	}else{
			$inactiveDataSets->{$newkey} = \%{ $resultHash->{$key} };
		}
	    }
	}elsif ( exists $owampEventType{$eventType}  ){
            my $newkey ="$resultHash->{$key}{\"srcIP\"}-$resultHash->{$key}{\"dstIP\"}-$resultHash->{$key}{\"count\"}-$resultHash->{$key}{\"bucket_width\"}-$resultHash->{$key}{\"schedule\"}";
            #check for duplicates
	    if($activeDataSets->{$newkey}){ #entry exists in active test
		if($resultHash->{$key}{data}{active} eq "Yes"){
			my $newminRtotal = $resultHash->{$key}{data}{min_delay}*$resultHash->{$key}{data}{datapoints}+$activeDataSets->{$newkey}->{data}{min_delay}*$activeDataSets->{$newkey}->{data}{datapoints};;
			my $newmaxRtotal = $resultHash->{$key}{data}{max_delay}*$resultHash->{$key}{data}{datapoints}+$activeDataSets->{$newkey}->{data}{max_delay}*$activeDataSets->{$newkey}->{data}{datapoints};
			my $newlossRtotal = $resultHash->{$key}{data}{loss}*$resultHash->{$key}{data}{datapoints}+$activeDataSets->{$newkey}->{data}{loss}*$activeDataSets->{$newkey}->{data}{datapoints};
			my $newdr = $activeDataSets->{$newkey}->{data}{datapoints}+$resultHash->{$key}{data}{datapoints};
			if($newdr > 0){
					$activeDataSets->{$newkey}->{data}{min_delay} = $newminRtotal/$newdr;
                	$activeDataSets->{$newkey}->{data}{max_delay} = $newmaxRtotal/$newdr;
                	$activeDataSets->{$newkey}->{data}{loss} = $newlossRtotal/$newdr;
			}else{
					$activeDataSets->{$newkey}->{data}{min_delay} = $newminRtotal;
                	$activeDataSets->{$newkey}->{data}{max_delay} = $newmaxRtotal;
                	$activeDataSets->{$newkey}->{data}{loss} = $newlossRtotal;
			}
	        	
                	$activeDataSets->{$newkey}->{data}{datapoints}= $newdr;
   		}
		#ignore inactive test if there is an active duplicate test
	 }elsif($inactiveDataSets->{$newkey}){ #entry exists inactive tests
		if($resultHash->{$key}{data}{active} eq "Yes"){
                	delete $inactiveDataSets->{$newkey};
                	$activeDataSets->{$newkey} = \%{ $resultHash->{$key} };
            	}
		#ignore inactive test if there is an inactive duplicate test
	 }else{#new test
	        if($resultHash->{$key}{data}{active} eq "Yes"){
                        $activeDataSets->{$newkey} = \%{ $resultHash->{$key} };
                }else{
                        $inactiveDataSets->{$newkey} = \%{ $resultHash->{$key} };
                }
	}   
      }
}
#find bidirectional tests
my $activeDirectionalHash   = addDirectionDetails($activeDataSets);
my $inactiveDirectionalHash = addDirectionDetails($inactiveDataSets);



my $ctr             = 0;

my $initiator;

if($ma_host_type eq "toolkit"){
my $tempInitiator1 = "";
my $tempInitiator2 = "";
#find initiator
	foreach my $key (keys %{$activeDirectionalHash}){
		if($ctr==0){
			$tempInitiator1 = $activeDirectionalHash->{$key}{src};
			$tempInitiator2 = $activeDirectionalHash->{$key}{dst};
			$ctr++;
		}else{
			if($tempInitiator1 eq $activeDirectionalHash->{$key}{src} || $tempInitiator1 eq $activeDirectionalHash->{$key}{dst}){
				$initiator = $tempInitiator1;
			}elsif($tempInitiator2 eq $activeDirectionalHash->{$key}{src} || $tempInitiator2 eq $activeDirectionalHash->{$key}{dst}){
				$initiator = $tempInitiator2;
			}
		}
		last if ($ctr>1);
	}
	
	if(defined $initiator && $initiator ne ""){
		foreach my $key (keys %{$activeDirectionalHash}){
			if($activeDirectionalHash->{$key}{dst} eq $initiator){
				my $tmpdst = $activeDirectionalHash->{$key}{dst};
				my $tmpdstRaw = $activeDirectionalHash->{$key}{dstRaw};
				my $tmpdstIP = $activeDirectionalHash->{$key}{dstIP};
				
				$activeDirectionalHash->{$key}{dst} = $activeDirectionalHash->{$key}{src};
				$activeDirectionalHash->{$key}{dstRaw} = $activeDirectionalHash->{$key}{srcRaw};
				$activeDirectionalHash->{$key}{dstIP} = $activeDirectionalHash->{$key}{srcIP};
				
				$activeDirectionalHash->{$key}{src}=$tmpdst;
				$activeDirectionalHash->{$key}{srcRaw}=$tmpdstRaw;
				$activeDirectionalHash->{$key}{srcIP}=$tmpdstIP;
				
				if($activeDirectionalHash->{$key}{bidirectional} eq "Yes"){
					my $dataRef = $activeDirectionalHash->{$key}{data};
					$activeDirectionalHash->{$key}{data} = $activeDirectionalHash->{$key}{dataR};
					$activeDirectionalHash->{$key}{dataR} = $dataRef;
				}else{
					my $dataRef = $activeDirectionalHash->{$key}{data};
					$activeDirectionalHash->{$key}{data} = $activeDirectionalHash->{$key}{dataR};
					$activeDirectionalHash->{$key}{dataR} = $dataRef;
					$activeDirectionalHash->{$key}{direction} = "reverse";
				}
			}else{
				$activeDirectionalHash->{$key}{direction} = "forward";
			}
		}	
		foreach my $key (keys %{$inactiveDirectionalHash}){
					if($inactiveDirectionalHash->{$key}{dst} eq $initiator){
				my $tmpdst = $inactiveDirectionalHash->{$key}{dst};
				my $tmpdstRaw = $inactiveDirectionalHash->{$key}{dstRaw};
				my $tmpdstIP = $inactiveDirectionalHash->{$key}{dstIP};
				
				$inactiveDirectionalHash->{$key}{dst} = $inactiveDirectionalHash->{$key}{src};
				$inactiveDirectionalHash->{$key}{dstRaw} = $inactiveDirectionalHash->{$key}{srcRaw};
				$inactiveDirectionalHash->{$key}{dstIP} = $inactiveDirectionalHash->{$key}{srcIP};
				
				$inactiveDirectionalHash->{$key}{src}=$tmpdst;
				$inactiveDirectionalHash->{$key}{srcRaw}=$tmpdstRaw;
				$inactiveDirectionalHash->{$key}{srcIP}=$tmpdstIP;
				
				if($inactiveDirectionalHash->{$key}{bidirectional} eq "Yes"){
					my $dataRef = $activeDirectionalHash->{$key}{data};
					$inactiveDirectionalHash->{$key}{data} = $inactiveDirectionalHash->{$key}{dataR};
					$inactiveDirectionalHash->{$key}{dataR} = $dataRef;
				}else{
					my $dataRef = $inactiveDirectionalHash->{$key}{data};
					$inactiveDirectionalHash->{$key}{data} = $inactiveDirectionalHash->{$key}{dataR};
					$inactiveDirectionalHash->{$key}{dataR} = $dataRef;
					$inactiveDirectionalHash->{$key}{direction} = "reverse";
				}
			}else{
				$inactiveDirectionalHash->{$key}{direction} = "forward";
			}
		}	
	}
}


$ctr=0;
my $sortedActiveSet = ();
my $sortedInactiveSet = ();
#Convert hash to sorted array (based on src)
foreach my $hashkey (
    sort {
        $activeDirectionalHash->{$a}{src} cmp $activeDirectionalHash->{$b}{src}
    } keys %{$activeDirectionalHash}
  )
{
    if (   $activeDirectionalHash->{$hashkey}{src}
        && $activeDirectionalHash->{$hashkey}{dst} )
    {
        $sortedActiveSet->[$ctr] = $activeDirectionalHash->{$hashkey};
        $ctr++;
    }

}
$ctr = 0;

foreach my $hashkey (
    sort {
        $inactiveDirectionalHash->{$a}{src}
          cmp $inactiveDirectionalHash->{$b}{src}
    } keys %{$inactiveDirectionalHash}
  )
{
    if (   $inactiveDirectionalHash->{$hashkey}{src}
        && $inactiveDirectionalHash->{$hashkey}{dst} )
    {

        $sortedInactiveSet->[$ctr] = $inactiveDirectionalHash->{$hashkey};
        $ctr++;
    }
}

#put in final dataset
my %finalResultHash;

$finalResultHash{"Active"}   = $sortedActiveSet;
$finalResultHash{"Inactive"} = $sortedInactiveSet;
if($ma_host_type eq "toolkit"){
	$finalResultHash{"initiator"} = $initiator;
}
#convert to JSON and return
my $json = new JSON;
my $json_result;

my $json_text =
  $json->pretty->allow_blessed->allow_nonref->allow_unknown->encode(
    \%finalResultHash );

print $cgi->header("application/json");
print $json_text;

exit 0;

# AddDirectionDetails
# This function determines of a test is bidirectional or not and adds the directional info to the hash

sub addDirectionDetails {
    my ($dataSetHashRef) = @_;

    my %biDirectionCheck;

    #for active data sets

    foreach my $key ( keys %{$dataSetHashRef} ) {
        my $revkey;

        if (   $eventType eq "http://ggf.org/ns/nmwg/tools/iperf/2.0"
            or $eventType eq
            "http://ggf.org/ns/nmwg/characteristics/bandwidth/achievable/2.0" )
        {
            $revkey =
"$dataSetHashRef->{$key}{\"dstIP\"}-$dataSetHashRef->{$key}{\"srcIP\"}-$dataSetHashRef->{$key}{\"protocol\"}-$dataSetHashRef->{$key}{\"timeDuration\"}";
        }
        elsif ( $eventType eq
            "http://ggf.org/ns/nmwg/characteristic/delay/summary/20070921"
            or $eventType eq "http://ggf.org/ns/nmwg/tools/owamp/2.0" )
        {
            $revkey =
"$dataSetHashRef->{$key}{\"dstIP\"}-$dataSetHashRef->{$key}{\"srcIP\"}-$dataSetHashRef->{$key}{\"count\"}-$dataSetHashRef->{$key}{\"bucket_width\"}-$dataSetHashRef->{$key}{\"schedule\"}";
        }

        #check if tests is bidirectional or not
 if ( ($revkey ne $key) && (defined $dataSetHashRef->{$revkey} )) {
        #this if checks if entry already exists for forward or reverse direction
            if (   !defined $biDirectionCheck{$key}
                && !defined $biDirectionCheck{$revkey} )
            {
                $biDirectionCheck{$key} = 1;
                $dataSetHashRef->{$key}{"bidirectional"} = "Yes";
                $dataSetHashRef->{$key}{"dataR"} =
                  \%{ $dataSetHashRef->{$revkey}{"data"} };
                delete $dataSetHashRef->{$revkey};
            }
        }
        else {
            if ( defined $dataSetHashRef->{$key}{'dst'} ) {
                $dataSetHashRef->{$key}{"bidirectional"} = "No";
                $dataSetHashRef->{$key}{"dataR"}         = "";
            }

        }
    }

    return $dataSetHashRef;
}

# function getData begins. This function retrieves maKeys or data for owamp and bwctl data
# Arguments - MA URL and the eventType
# Returns a hash containing test details and results
sub getData {

    #get the input values
    my ( $ma_url, $eventType ) = @_;

    my $start;
    my $end = time;
    my $dataType;

    #set the parameter list for tests based on eventType
    my @parameterList;

    if (exists $bwctlEventType{$eventType} )
    {
        push( @parameterList, "protocol" );
        push( @parameterList, "timeDuration" );
        $dataType = "bwctl";
        $start    = $end - 7 * 24 * 60 * 60;    #Collect 1 week for bwctl
    }
    elsif ( exists $owampEventType{$eventType} )
    {
        push( @parameterList, "count" );
        push( @parameterList, "bucket_width" );
        push( @parameterList, "schedule" );
        $dataType = "owamp";
        $start =
          $end - 0.5 * 60 * 60;  #Collect 1/2 hour for owamp. 
    }

    # Create client
    my $ma = new perfSONAR_PS::Client::MA( { instance => $ma_url } );

    # Define a subject
    my $subject = "<x:subject xmlns:x=\"$eventType\" id=\"subject\">\n";
    $subject .=
"    <nmwgt:endPointPair xmlns:nmwgt=\"http://ggf.org/ns/nmwg/topology/2.0/\" />\n";
    $subject .= "</x:subject>\n";

    # Set the eventType
    my @eventTypes = ($eventType);

# Send request depending on what type of data has been requested - (metadata or data)

    my $result;
    my $rsltHash;
    my $dataHash;

    my %maKeysFinalHash;
    $result = $ma->setupDataRequest(
        {
            subject    => $subject,
            eventTypes => \@eventTypes,
            start      => $start,
            end        => $end
        }
    );

    #Process result
	
    #Get metadata
    if($result){
    	$rsltHash = getMetadataHash( $result->{metadata}, \@parameterList );
    }
    
    #Process data - Only if metadata exists, process data
    if (defined $rsltHash){
    	if ( $dataType eq "bwctl" ) {

        	#Call processBwctlPSData();
        	$dataHash = _processBwctlPSData( $result->{data} );

    	}elsif ( $dataType eq "owamp" ) {

        	#Call processOwampPSData();
       	    $dataHash = _processOwampPSData( $result->{data} );
    	}
		#combine data and test details
		if(defined $dataHash){
    		foreach my $key ( keys %{$rsltHash} ) {
        		$rsltHash->{$key}{"data"} = \%{ $dataHash->{$key} };
		
   	  	}
	}
		return $rsltHash;
    }else{
    	return;
    }
    
}

#Extracts the throughput values from bwctl XML tags, calculates average and returns a hash of the result
#Arguments - Reference to the array of XML data tags
# Returns reference to hash containing metadataId as key, throughput and active/inactive info
sub _processBwctlPSData {
    my ($dataResult) = @_;
    my %mdIdBwctlDataHash;
    DATA: foreach my $data ( @{$dataResult} ) {
        my %tmpHash;
        my $parser = XML::LibXML->new(ext_ent_handler => sub { return ""; });
        my $doc;
        eval { $doc = $parser->parse_string($data); };
        if ($@) {
            next DATA;
        }
        my $root  = $doc->getDocumentElement;
 
        my $tmpID = $root->find("\@metadataIdRef");

        my @childnodes = $root->findnodes(".//*[local-name()='datum']");
        my $throughputStats = Statistics::Descriptive::Full->new();
		if ( scalar @childnodes != 0){
			if($childnodes[0]->textContent !~ m/returned 0 results/i){
				for ( my $i = 0 ; $i < scalar @childnodes; $i++ ) {
            		my $tmpval = $childnodes[$i]->getAttribute("throughput");
            		if ( $tmpval ne "" ) {
                		$throughputStats->add_data($tmpval);
            		}
        		}	
			}
		}
 

        my %finalval;
        $finalval{"throughput"} = $throughputStats->mean();
		$finalval{"datapoints"} = $throughputStats->count();
        if ( $throughputStats->mean() == 0 || $throughputStats->mean() eq "" ) {
            $finalval{"active"} = "No";
        }
        else {
            $finalval{"active"} = "Yes";
        }
        $mdIdBwctlDataHash{$tmpID} = \%finalval;
    }
    return \%mdIdBwctlDataHash;

}

#Extracts the min, max values from Owamp XML tags, calcualtes average and returns a hash of the result
#Arguments - Reference to the arrya of data XML tags
# Returns reference to hash containing metadataId as key, min, max and active/inactive info
sub _processOwampPSData {
    my ($dataResult) = @_;
    my %mdIdOwampDataHash;
    DATA: foreach my $data ( @{$dataResult} ) {
        my %tmpHash;
        my $parser = XML::LibXML->new(ext_ent_handler => sub { return ""; });
        my $doc;
        eval { $doc = $parser->parse_string($data); };
        if ($@) {
            next DATA;
        }
        my $root  = $doc->getDocumentElement;
        my $tmpID = $root->find("\@metadataIdRef");

        my @childnodes = $root->findnodes(".//*[local-name()='datum']");
        if ( scalar @childnodes != 0){
        	#used to calculate the four metrics - min_delay, max_delay, loss, maxError
            my $minDelayStats = Statistics::Descriptive::Full->new();
            my $maxDelayStats = Statistics::Descriptive::Full->new();
            my $lossStats     = Statistics::Descriptive::Full->new();
            
			if($childnodes[0]->textContent !~ m/returned 0 results/i){
				    #not all the data tags have both attributes
            		for ( my $i = 0 ; $i < scalar @childnodes ; $i++ ) {
                		my $tmpval = $childnodes[$i]->getAttribute("min_delay");
                		if ( $tmpval ne "" ) {
                    		$minDelayStats->add_data($tmpval);
                		}
                		$tmpval = $childnodes[$i]->getAttribute("max_delay");
               			if ( $tmpval ne "" ) {
                    		$maxDelayStats->add_data($tmpval);
                		}
                		my $loss = $childnodes[$i]->getAttribute("loss");
                		my $sent = $childnodes[$i]->getAttribute("sent");
                		if ( $loss ne "" and $sent ne "") {
                			if($sent != 0){
                				$lossStats->add_data($loss/$sent);
                			}    
                		}
            		}
			}
            my %finalval;
            $finalval{min_delay} = $minDelayStats->trimmed_mean(0.05) * 1000;
            $finalval{max_delay} = $maxDelayStats->trimmed_mean(0.05) * 1000;
            $finalval{loss}      = sprintf("%3.2f%%", $lossStats->trimmed_mean(0.05) * 100);
	    	$finalval{"datapoints"} = $minDelayStats->count();

            if (   ( $finalval{min_delay} == 0 || $finalval{min_delay} eq "" )
                && ( $finalval{max_delay} == 0 || $finalval{max_delay} eq "" ) )
            {
                $finalval{"active"} = "No";
            }
            else {
                $finalval{"active"} = "Yes";
            }

            $mdIdOwampDataHash{$tmpID} = \%finalval;
        }
    }
    return \%mdIdOwampDataHash

}

# Proceses metadata and returns a hash containing src, dst, srcIP, dstIP and the parameter details.
# Arguments  - Reference to parameter list and array of metadataTags
# Returns reference to hash containing metadataId as key, test details
sub getMetadataHash {
    my ( $metadataResult, $parameterList ) = @_;
    my %mdIdTestDetailsHash;
	METADATA:foreach my $metadata ( @{$metadataResult} ) {
        my %tmpHash;
        my $parser = XML::LibXML->new(ext_ent_handler => sub { return ""; });
        my $doc;
        eval { $doc = $parser->parse_string($metadata); };
        if ($@) {
            next METADATA;
        }
        
        my $root = $doc->getDocumentElement;
        
        my @eventType = $root->findnodes(".//*[local-name()='eventType']");
        foreach my $event (@eventType){
        	if ($event =~ m/error/i){
        		next METADATA;
        	}
        }
        
        my $tmpID         = $root->find("\@id");
        my $srcaddressval = $root->find(".//*[local-name()='src']/\@value");
        my $srcaddress    = "$srcaddressval";
        my $srcRaw        = "$srcaddressval";
        my $srcType       = _get_endpoint_type($srcaddress);
        my $src;
        if ( $srcType eq "ipv4" or $srcType eq "ipv6" ) {
            $src = reverse_dns($srcaddress);
        }
        elsif ( $srcType eq "hostname" ) {
            my @ips = resolve_address($srcaddress);
            my $ip = @ips[0];
            $src        = $srcaddress;
            $srcaddress = $ip;
        }
		$src = $srcaddress unless $src;
		$srcaddress = $src unless $srcaddress;

        my $dstaddressval = $root->find(".//*[local-name()='dst']/\@value");
        my $dstaddress    = "$dstaddressval";
        my $dstRaw        = "$dstaddressval";
        my $dstType       = _get_endpoint_type($dstaddress);
        my $dst = $dstaddress;
        if ( $dstType eq "ipv4" or $dstType eq "ipv6" ) {
            $dst = reverse_dns($dstaddress);
        }
        elsif ( $dstType eq "hostname" ) {
            my @ips = resolve_address($dstaddress);
            my $ip = @ips[0];
            $dst        = $dstaddress;
            $dstaddress = $ip;
        }
		$dst = $dstaddress unless $dst;
		$dstaddress = $dst unless $dstaddress;

        $tmpHash{"src"}   = "$src";
        $tmpHash{"dst"}   = "$dst";
        $tmpHash{"srcIP"} = "$srcaddress";
        $tmpHash{"dstIP"} = "$dstaddress";
        $tmpHash{"srcRaw"}   = "$srcRaw";
        $tmpHash{"dstRaw"}   = "$dstRaw";
 

        foreach my $param ( @{$parameterList} ) {
            my $paramvalue;
            #schedule parameter alone has a child node
            if ( $param eq "schedule" ) {
                $paramvalue = $root->find(
                    ".//*[local-name()='parameter'][\@name=\"$param\"]/interval"
                );
            }
            else {
                $paramvalue = $root->find(
                    ".//*[local-name()='parameter'][\@name=\"$param\"]");
            }
            $tmpHash{$param} = "$paramvalue";
        }

        $mdIdTestDetailsHash{$tmpID} = \%tmpHash;
    }
    return \%mdIdTestDetailsHash;
}

sub _get_endpoint_type {
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
