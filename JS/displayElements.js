function changeMousePointer(el){
	el.style.cursor = 'pointer';
}

function displayImage(image,displayVal){

	var dval;
	if(displayVal == true){
		dval="block";
	}else{
		dval="none";
	}		
	image.style.display = dval;
	
}
