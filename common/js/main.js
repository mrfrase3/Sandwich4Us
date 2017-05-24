{

	/*
		HTML5 automatically validates inputs if the correct attributes are set, which I have done. Any further validation would be done on the server side.
	*/

	"use strict";

	var insertDates = function(){ //populates dynamic dates
		var lastMod = new Date(document.lastModified);
		var lastAcc = new Date();
		document.getElementById("last-modified").innerText = lastMod.toLocaleString();
		document.getElementById("accessed").innerText = lastAcc.toLocaleString();
	}

	insertDates();

	var showSection = function(sect){
		var sections = document.querySelectorAll(".content .tile"); //go through all the sections
		for(var i = 0; i < sections.length; i++){
			sections[i].className = sections[i].className.replace("active", ""); //hide all of them
			if(sections[i].className.indexOf(sect) !== -1){
				sections[i].className += " active"; // only show what we want
			}
		}
		var navbtns = document.querySelectorAll(".navbar .nav-button.toggle-section"); // go through all the nav buttons
		for(var i = 0; i < navbtns.length; i++){
			navbtns[i].className = navbtns[i].className.replace("active", ""); // unhighlight them all
			if(navbtns[i].getAttribute("data-show") == sect){
				navbtns[i].className += " active"; // only highlight the one we want
			}
		}
		document.getElementById("nav-menu-toggle").checked = false; // hide the menu if in responsive small screen mode
	}

	var setupSectionToggle = function(){
		var toggles = document.querySelectorAll(".toggle-section"); //go through all the toggle elements
		for (var i = 0; i < toggles.length; i++) {
			toggles[i].onclick = function(e){ // add a click handler that will call showSection
				e.preventDefault();
				var sect = e.target.getAttribute("data-show");
				if(sect) showSection(sect);
			}
		}
	}

	setupSectionToggle()

}