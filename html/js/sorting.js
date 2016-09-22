function sortTable(tableName, col, sortorder){
	var myTable = document.getElementById(tableName);
	var length = myTable.rows.length;	
	var collength = myTable.rows[0].cells.length;
	console.log(collength);	
	//begin at 1 since 0 is table heading
	for (var i=1; i<length; i++){
		var key = myTable.rows[i].cells[col].textContent;
		var keyrow = myTable.rows[i];
		for(var j=i-1; j>0; j--){
			var jval = myTable.rows[j].cells[col].textContent;
			if(jval > key){
				myTable.insertBefore(myTable.rows[j],myTable.rows[j+2]);
			}else{
				myTable.insertBefore(keyrow,myTable.rows[j+1]);
				break;
			}	
		}
	}
	toggleSortArrowSymbols(tableName, col);
}

function toggleSortArrowSymbols(tableName,col){
	console.log("came inside toggleSortArrow");
	var myTable = document.getElementById(tableName);
	var collength = myTable.rows[0].cells.length;
	//length-1 to avoid the graph field
	for (var i=0; i<collength-1; i++){
		var imgid=tableName+i;
		var image = document.getElementById(imgid);
		if(i==col){
			displayImage(image,true);
		}else{
			displayImage(image,false);
		}

	}

}
