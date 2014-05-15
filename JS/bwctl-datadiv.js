google.load('visualization', '1', {'packages':['corechart']});
function createDataDisplayDiv(evtType){
		var displaydiv = document.getElementById("datadisplay");
		displaydiv.style.visibility="visible";
       
                if((evtType == "http://ggf.org/ns/nmwg/tools/iperf/2.0") || (evtType == "http://ggf.org/ns/nmwg/characteristics/bandwidth/achievable/2.0")){
                        var totalInResult=[];
                        var totalOutResult=[];
                        var occurenceOutCount=[];
                        var occurenceInCount=[];
                        var hostsCount=0;
                        //totalResult["in"]=0;totalResult["out"]=0;occurenceCount["in"]=0;occurenceCount["out"]=0;
                        if(response){
                                var parsedData = eval("(" + response + ")");
                                        var allActiveTests = parsedData["Active"];
                                        for (var testkey in allActiveTests){
							var bidirectional = allActiveTests[testkey]['bidirectional'];
                                                        var sHostName = allActiveTests[testkey]['src'];
                                                        var dHostName = allActiveTests[testkey]['dst'];
                                                        if(isNaN(totalOutResult[sHostName])){
                                                                totalOutResult[sHostName]=0;
                                                                hostsCount += 1;
                                                        }

                                                        if(isNaN(occurenceOutCount[sHostName])){
                                                                occurenceOutCount[sHostName]=0;
                                                        }
                                                        if(isNaN(totalInResult[dHostName])){
                                                                totalInResult[dHostName]=0;
                                                                hostsCount += 1;
                                                        }
                                                        if(isNaN(occurenceInCount[dHostName])){
                                                                occurenceInCount[dHostName]=0;
                                                        }

                                                        totalOutResult[sHostName] += allActiveTests[testkey]["data"]["throughput"];
                                                        occurenceOutCount[sHostName] += 1;

	                                                        if (bidirectional == "Yes"){
                                                                if(isNaN(totalInResult[sHostName])){
                                                                        totalInResult[sHostName]=0;
                                                                }
                                                                if(isNaN(occurenceInCount[sHostName])){
                                                                        occurenceInCount[sHostName]=0;
                                                                }
                                                                totalInResult[sHostName] += allActiveTests[testkey]["dataR"]["throughput"];
                                                                occurenceInCount[sHostName] += 1;
                                                        }else{
                                                                if(isNaN(totalInResult[sHostName])){
                                                                        totalInResult[sHostName]=0;
                                                                }
                                                                if(isNaN(occurenceInCount[sHostName])){
                                                                        occurenceInCount[sHostName]=0;
                                                                }
                                                                totalInResult[sHostName] += 0;
                                                                occurenceInCount[sHostName] += 1;

                                                        }


                                                //}else if(allActiveTests[testkey]['dst']==hostVal){
                                                        //totalResult["in"][allActiveTests[testkey]['dst']] += allActiveTests[testkey]["data"]["throughput"];
                                                        //occurenceCount["in"] += 1;
                                                        totalInResult[dHostName] += allActiveTests[testkey]["data"]["throughput"];
                                                        occurenceInCount[dHostName] += 1;
                                                        if (bidirectional == 'Yes'){
                                                                if(isNaN(totalOutResult[dHostName])){
                                                                        totalOutResult[dHostName] =0;
                                                                }

                                                                if(isNaN(occurenceOutCount[dHostName])){
                                                                        occurenceOutCount[dHostName]=0;
                                                                }
                                                                totalOutResult[dHostName] += allActiveTests[testkey]["dataR"]["throughput"];
                                                                occurenceOutCount[dHostName] += 1;
                                                                //occurenceCount["out"] += 1;
                                                        }else{
                                                                if(isNaN(totalOutResult[dHostName])){
                                                                        totalOutResult[dHostName]=0;
                                                                }

                                                                if(isNaN(occurenceOutCount[dHostName])){
                                                                        occurenceOutCount[dHostName]=0;
                                                                }
                                                                totalOutResult[dHostName] += 0;
                                                                occurenceOutCount[dHostName] += 1;

                                                        }

                                                //}
                                        }

                  var outDataPoints="";
                  var inDataPoints="";
                  var xLabel="";
                  //google.setOnLoadCallback(function(){
                        // Create our data table.
                            //var dataTableArray=[];

                        var data = new google.visualization.DataTable();
                        data.addColumn('string', 'Hosts');
                        data.addColumn('number', 'In(Gbps)');
                        data.addColumn('number', 'Out(Gbps)');


                        var count=0;
                        var idx = 0;
                        //find average throughput as well as the maximum throughput
                        var maxVal=0;
                        for (var host in totalOutResult){
                                totalOutResult[host] = Math.round(totalOutResult[host]/(occurenceOutCount[host]*1000000))/1000 ;
                                        totalInResult[host] = Math.round(totalInResult[host]/(occurenceInCount[host]*1000000))/1000 ;
                                        if(totalOutResult[host] > maxVal){
                                                maxVal=totalOutResult[host];
                                        }
                                         if(totalInResult[host] > maxVal){
                                                maxVal=totalInResult[host];
                                        }

                        }
                        //draw the summar graphs
                        var data = new google.visualization.DataTable();
                        data.addColumn('string', 'Hosts');
                        data.addColumn('number', 'In(Gbps)');
                        data.addColumn('number', 'Out(Gbps)');

                         for (var host in totalOutResult){
                                          data.addRow([host,totalInResult[host],totalOutResult[host]]);
                                          //dataTableArray[idx].addRow([host,totalInResult[host],totalOutResult[host]]);
                                          if((count%10==9) || (count==getLength(totalOutResult)-1)){
                                                  idx++;
                                                  var widthVal=1000;
                                                  //var chartDiv = new google.visualization.ColumnChart(document.getElementById('datadisplay'));
                                                  var cht = document.createElement('div');
                                                  cht.id="chart"+idx;

                                                  document.getElementById("datadisplay").appendChild(cht);
                                                  var chart = new google.visualization.ColumnChart(cht);
                                                  if((count==getLength(totalOutResult)-1)&&(count%10>4)){
                                                       widthVal = (count%10+1)*100;
                                                  }else if(count%10 <= 4){
                                                       widthVal = 500;
                                                  }
                                                  chart.draw(data, {width: widthVal,
                                                        height:200, is3D: false, title: 'Throughput(1 week average)', vAxis:{minValue: 0.0, maxValue: maxVal},
                                                        hAxis:{showTextEvery: 1}, legend: 'top'});
                                                  data = new google.visualization.DataTable();
                                                  data.addColumn('string', 'Hosts');
                                                data.addColumn('number', 'In(Gbps)');
                                                data.addColumn('number', 'Out(Gbps)');

                                         }
                                          count++;
                        }


                }//response if condition ends



        }

	}


	//bwctl data
	function displayData(){
		var selectBox = document.getElementById("hostSelection");
		var selindex = selectBox.selectedIndex;
		var hostVal = selectBox.options[selindex].value;

  		if((queryParameters["eventType"] == "http://ggf.org/ns/nmwg/characteristic/delay/summary/20070921") || (queryParameters["eventType"] == "http://ggf.org/ns/nmwg/tools/owamp/2.0")){
			if (hostVal != "none"){
				if(response){
					var parsedData = eval("(" + response + ")");
					var htmltext;

					if((parsedData["Bidirectional"]["Active"][hostVal]) != null){
						htmltext="Forward direction:<br>Minimum Delay:"+parsedData["Bidirectional"]["Active"][hostVal]["data"]["min_delay"]+"<br>Maximum Delay:"+parsedData["Bidirectional"]["Active"][hostVal]["data"]["max_delay"];
						htmltext +="<br><br>Reverse Direction:<br>Minimum Delay:"+parsedData["Bidirectional"]["Active"][hostVal]["dataR"]["min_delay"]+"<br>Maximum Delay:"+parsedData["Bidirectional"]["Active"][hostVal]["dataR"]["max_delay"];
					}else if((parsedData["Bidirectional"]["Inactive"][hostVal]) != null){
						htmltext="Inactive test: No data";
					}else if((parsedData["NonBidirectional"]["Active"][hostVal]) != null){
						htmltext="Forward direction:<br>Minimum Delay:"+parsedData["NonBidirectional"]["Active"][hostVal]["data"]["min_delay"]+"<br>Maximum Delay:"+parsedData["NonBidirectional"]["Active"][hostVal]["data"]["max_delay"];					
						htmltext +="<br>Note: Single direction test";
					}else if((parsedData["NonBidirectional"]["Inactive"][hostVal]) != null){
						htmltext="Inactive test: No data";
					}	

					var resultDisplay = document.getElementById("resultDisplay");
					resultDisplay.style.visibility = "visible";
					resultDisplay.innerHTML = htmltext;
				
				}
			}
		}	
	
	
	}


	function getLength(tempArray) {
		   var result = 0;
		   for ( tempValue in tempArray ) {
	      		result++;
	   	   }
		
	   	return result;
	}	
	
