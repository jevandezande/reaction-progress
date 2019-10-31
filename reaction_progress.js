/*
 * JavaScript for reaction progress
 *
 * Created by: Jonathon Vandezande
 * Started: 5/22/2012
 */

// An array listing the names of the molecules
var molecules = ['A', 'B', 'C', 'X', 'Y', 'Z'];

// Array of the stoichiometric numbers (coefficients)
// !Coefficients are negative for reactants, and positive for products!
var coefficients = [-2, -1, 0, 2, 0, 0];
var coefficientsGood = true;

// Matrix corresponding to the data in the table
var moles =
[
	[1, 1, 0, 0, 0, 0], // Initial Moles
	[0, 0, 0, 0, 0, 0], // Change Moles
	[0, 0, 0, 0, 0, 0], // End Moles
	[0, 0, 0, 0, 0, 0], // moles at min extent
	[0, 0, 0, 0, 0, 0], // moles at max extent
];

// Array of molar masses of the reactants and products
var molarMass = [1, 1, 1, 1, 1, 1];

// Value Limits
var MAXMOLES = 10000000;

var percent_complete = 0
var extent = 0
var min_extent = 0
var max_extent = 0
var mode = "mole";

// Canvases
var canvas1, canvas2;
// Sizes
var MAXHEIGHT = 500
var MAXWIDTH = 600
var MINHEIGHT = 200
var MINWIDTH = 300;

// For easier changing of colors
var color = {
	initial:	'#aa0000',
	end:		'#0000aa',
	A:			'#111111',
	B:			'#00aa00',
	C:			'#00aaaa',
	X:			'#aa00aa',
	Y:			'#ff8800',
	Z:			'#eecc33',
	slider:		'#aa0000',
	graphAxis:	'#000000',
	graphGrid:	'#999999',
}

var font = {
	title:			"30px sans-serif",
	axisLabels:		"20px sans-serif",
	axisNumbers:	"13px sans-serif",
	legend:			"20px sans-serif",
}

/*
 * Initializes the program
 */
function init()
{
	window.onresize = function(event) {
		initCanvases();
		updateDisplay(true);
	}
	initCanvases();

	update(true);
}

/*
 * Initialize the canvases
 */
function initCanvases()
{
	// Get the canvases
	canvas1 = document.getElementById('canvas1');
	canvas2 = document.getElementById('canvas2');
	canvas1.cx = canvas1.getContext('2d');
	canvas2.cx = canvas2.getContext('2d');
	canvas1.threeD = true;

	// Add 3D look to bar chart
	if ( !canvas1.threeD ) {
		canvas1.barDepth = 0;
		canvas1.barSlant = 0;
	}
	else {
		canvas1.barDepth = 10;
		canvas1.barSlant = 10;
	}

	scaleCanvases();

	// Set text defaults
	canvas1.cx.textAlign = canvas2.cx.textAlign = 'center';
	canvas1.cx.lineCap = 'round';
	canvas2.cx.lineCap = 'round';
}

/*
 * Scale the canavases to the appropriate sizes
 */
function scaleCanvases()
{
	var height = window.innerHeight/2;
	var width = window.innerWidth/2 - 30;

	// Make the canvases sizes within the max and min heights
	height = Math.max(Math.min(height, MAXHEIGHT), MINHEIGHT);
	width = Math.max(Math.min(width, MAXWIDTH), MINWIDTH);

	// Size the canvases
	canvas1.height = canvas2.height = height;
	canvas1.width = canvas2.width = width;
	canvas1.graphLeft = canvas2.graphLeft = 65;
	canvas1.graphRight = canvas2.graphRight = canvas2.width-65;
	canvas1.graphWidth = canvas2.graphWidth = canvas2.graphRight - canvas2.graphLeft;
	canvas1.graphTop = canvas2.graphTop = 60;
	canvas1.graphBottom = canvas2.graphBottom = canvas2.height - 60;
	canvas1.graphHeight = canvas2.graphHeight = canvas2.graphBottom - canvas2.graphTop;
}

/*
 * Update the page and all of the values based on the coefficients,
 *	percent_complete, and initial amounts
 *
 * @param valuesChange
 *		A boolean that is true if the coefficient or mole amount values changed
 */
function update(valuesChange)
{
	if ( valuesChange ) {
		calcExtent();
		updateSlider();
	}
	updateTableValues(valuesChange);
	updateDisplay();
}

/*
 * Calculates the extent of reaction and percent complete based on the
 *  coefficient values and initial concentrations
 */
function calcExtent()
{
	extent = 0;
	max_extent = Infinity;
	min_extent = -Infinity;
	for ( var i = 0; i < 3; i++ ) {
		if ( coefficients[i] != 0 ) {
			max_extent = Math.min( max_extent, -moles[0][i]/coefficients[i] );
		}
		if ( coefficients[i+3] != 0 ) {
			min_extent = Math.max( min_extent, -moles[0][i+3]/coefficients[i+3] );
		}
	}

	extent_range = max_extent - min_extent;

	if ( max_extent != min_extent ) {
		percent_complete = (extent-min_extent)/(extent_range)*100;
	}
	else {
		percent_complete = 0;
		alert('The reaction cannot progress, as at least one of the products ' +
				'and at least one of the reactants that are taking part in the ' +
				'reaction have no initial amount.')
	}
}

/*
 * Updates all of the items displayed on the page
 */
function updateDisplay()
{
	updateTables();
	updateBarChart();
	updateGraph();
}

/*
 * Deals with a changed coefficient
 *
 * @param value
 *		The new value
 * @param coefficient
 *		The coefficient that was updated
 */
function coefficientUpdate(value, coefficient)
{
	coefficientsGood = true;
	var newValue = parseFloat(value);
	coefficients[coefficient] = newValue;

	// Stoichimetric numbers are negative for reactants
	if ( coefficient < 3 ) {
		if ( newValue <= 0 ) {
			document.getElementById('coefficient' + molecules[coefficient]).style.background = null;
		}
		else {
			document.getElementById('coefficient' + molecules[coefficient]).style.background = "#BB0000";
		}
	}
	else if ( newValue >= 0 ) {
		document.getElementById('coefficient' + molecules[coefficient]).style.background = null;
	}
	else {
		document.getElementById('coefficient' + molecules[coefficient]).style.background = "#BB0000";
	}

	for ( var i = 0; i < 3; i++ ) {
		if ( coefficients[i] > 0 || coefficients[i] === NaN ) {
			coefficientsGood = false;
		}
		if ( coefficients[i+3] < 0 || coefficients[i+3] === NaN ) {
			coefficientsGood = false;
		}
	}

	if ( coefficientsGood == false ) {
		alert('Coefficients must be greater than or equal to 0.');
	}
	else if ( coefficients[0] == 0 && coefficients[1] == 0 && coefficients[2] == 0 ) {
		coefficientsGood = false;
		alert('At least one of the coefficients on the reactants must be greater ' +
				'than 0, or else no reaction can take place.');
	}
	else if ( coefficients[3] == 0 && coefficients[4] == 0 && coefficients[5] == 0 ) {
		coefficientsGood = false
		alert('At least one of the coefficients on the products must be greater ' +
				'than 0, or else no reaction can take place.');
	}

	if ( coefficientsGood ) {
		update(true);
	}
}

/*
 * Deals with a change in input mode between moles and mass
 *
 * @param newMode
 *		The mode the system is in
 */
function modeUpdate(newMode)
{
	// Show/hide molar mass input
	if ( newMode == "mole" ) {
		mode = newMode;
		document.getElementById("molarMass").hidden = true;
		document.getElementById("initial").innerHTML = "Initial (moles)";
		document.getElementById("change").innerHTML = "Change (moles)";
		document.getElementById("end").innerHTML = "End (moles)";
	}
	else if ( newMode == "mass" ) {
		mode = newMode;
		document.getElementById("molarMass").hidden = false;
		document.getElementById("initial").innerHTML = "Initial (grams)";
		document.getElementById("change").innerHTML = "Change (grams)";
		document.getElementById("end").innerHTML = "End (grams)";

	}
	else {
		console.log("Error in mode change");
	}

	checkInitial();

	update(true);
}

/*
 * Iterates through the initial amounts and updates them based on the value in
 *  the HMTL
 */
function checkInitial()
{
	for ( var i = 0; i < moles[0].length; i++ ) {
		newValue = document.getElementById( 'initial' + molecules[i] + 'Input' ).value;
		// TODO: check value
		if ( mode == "mole" ) {
			moles[0][i] = parseFloat(newValue);
		}
		else {
			moles[0][i] = parseFloat(newValue)/molarMass[i];
		}
	}
}

/*
 * Deals with changed molar masses
 *
 * @param value
 *		The new amount
 * @param type
 *		The position in the molar mass array corresponding to the position of
 *		the desired product or reactant
 */
function molarMassUpdate(value, type)
{
	var newMolarMass = parseFloat(value);
	if ( newMolarMass > 0 ) {
		var oldMolarMass = molarMass[type]
		moles[0][type] = moles[0][type]*oldMolarMass/newMolarMass;
		molarMass[type] = newMolarMass;
		update(true);
	}
	else {
		alert("Molar Masses must be greater than 0");
		return;
	}
}

/*
 * Deals with a changed initial amount
 *
 * @param value
 *		The new amount
 * @param type
 *		The position in the moles matrix corresponding to the position of the
 *		 product or reactant
 */
function initialAmountUpdate(value, type)
{
	var newMoles;
	var newValue = parseFloat(value);
	if ( mode == "mole" ) {
		newMoles = newValue;
	}
	else {
		newMoles = newValue/molarMass[type];
	}

	if ( newMoles <= MAXMOLES && newMoles >= 0 ) {
		moles[0][type] = newMoles;
	}
	else {
		alert("The number of moles must be between 0 and " + MAXMOLES + ", inclusive.");
	}
	update(true);
}

/*
 * Updates the state of the reaction based on the extent (called by the slider)
 *
 * @param percent_complete
 *		the extent of the reaction as a percentage of completion
 */
function sliderUpdate(perc)
{
	percent_complete = parseInt(perc);
	extent = percent_complete*(extent_range)/100+min_extent;
	update(false);
}

/*
 * Updates the state of reaction based on the extent
 *
 * @param e
 *		The input extent
 */
 function extentUpdate(e)
 {
	newExtent = parseFloat(e)
	// If valid
	if (newExtent <= max_extent && newExtent >= min_extent) {
		extent = newExtent;
		percent_complete = (extent-min_extent)/(extent_range)*100;
		updateSlider();
		update(false);
	}
	else {
		alert('The extent must be number between ' + round(min_extent, 4, 6) +
				' and ' + round(max_extent, 4, 6) + ' inclusive.' );
	}
 }

 /*
 * Updates the position of the slider based on how far the reaction has proceeded
 */
function updateSlider()
{
	// It works, but there should be a better way to implement this
	document.getElementById("completionSlider").value = percent_complete;
}

/*
 * Updates the displayed extent in the extent table
 */
function updateExtent()
{
	document.getElementById('extentMoles').value = round(extent,4,6);
}

/*
 * Updates the change and end values in the table
 *
 * @param valuesChange
 *		Whether the essential values (eg. initial values) have changed
 */
function updateTableValues(valuesChange)
{
	for ( var i = 0; i < 6; i++ ) {
		moles[1][i] = extent*coefficients[i];
		moles[2][i] = moles[0][i] + moles[1][i];
		if ( valuesChange ) {
			moles[3][i] = moles[0][i] + min_extent*coefficients[i];
			moles[4][i] = moles[0][i] + max_extent*coefficients[i];
		}
	}
}

/*
 * Updates the values in the table
 */
function updateTables()
{
	//Extent table
	updateExtent();
	document.getElementById("percentcomplete").innerHTML = round(percent_complete, 2, 0) + "%";

	// Products and Reactants table
	for ( var i = 0; i < 6; i++ ) {
		if ( mode == "mole" ) {
			document.getElementById("change" + molecules[i]).innerHTML =
					round(moles[1][i], 4, 6);
			document.getElementById("end" + molecules[i]).innerHTML =
					round(moles[2][i], 4, 6);
		}
		else {
			document.getElementById("change" + molecules[i]).innerHTML =
					round(moles[1][i]*molarMass[i], 4, 6);
			document.getElementById("end" + molecules[i]).innerHTML =
					round(moles[2][i]*molarMass[i], 4, 6);
		}
	}
}

/*
 * Updates the bar charts by scaling the bars to the correct size based on the extent
 *  of the reaction
 */
function updateBarChart()
{
	var max;
	if ( mode == "mole" ) {
		max = Math.max(moles[3][0], moles[3][1], moles[3][2], moles[3][3], moles[3][4], moles[3][5],
						moles[4][0], moles[4][1], moles[4][2], moles[4][3], moles[4][4], moles[4][5]);
	}
	else {
		max = Math.max(moles[3][0]*molarMass[0], moles[3][1]*molarMass[1],
						moles[3][2]*molarMass[2], moles[3][3]*molarMass[3],
						moles[3][4]*molarMass[4], moles[3][5]*molarMass[5],
						moles[4][0]*molarMass[0], moles[4][1]*molarMass[1],
						moles[4][2]*molarMass[2], moles[4][3]*molarMass[3],
						moles[4][4]*molarMass[4], moles[4][5]*molarMass[5]);
	}
	canvas1.scale = canvas1.graphHeight/max;

	// Clear the canvas
	canvas1.cx.clearRect(0, 0, canvas1.width, canvas1.height);

	drawBarChartAxis(max);

	drawBarChartLegend();

	drawBarChartBars(max);
}

/*
 * Draw the backrgound for the bar chart
 *
 * @param max
 *		The max height that can be achieved by any bar
 */
function drawBarChartAxis(max)
{
	// Draw the axis titles and grid lines
	// canvas2.cx.font = font.title;
	// canvas2.cx.fillText('Title', canvas2.graphLeft + canvas2.graphWidth/2, canvas2.graphTop - 30);
	canvas1.cx.fillStyle = '#000000';
	canvas1.cx.strokeStyle = color.graphGrid;
	if ( canvas1.threeD ) {
		// Rear left vertical axis
		canvas1.cx.lineWidth = 1;
		canvas1.cx.beginPath();
		canvas1.cx.moveTo(canvas1.graphLeft + canvas1.barSlant + .5,
							canvas1.graphBottom - canvas1.barDepth);
		canvas1.cx.lineTo(canvas1.graphLeft + canvas1.barSlant + .5,
							canvas1.graphTop - canvas1.barDepth);
		canvas1.cx.stroke();
		// Slanted line to right vertical axis
		canvas1.cx.beginPath();
		canvas1.cx.moveTo(canvas1.graphRight, canvas1.graphBottom);
		canvas1.cx.lineTo(canvas1.graphRight + canvas1.barSlant,
							canvas1.graphBottom - canvas1.barDepth);
		canvas1.cx.stroke();
	}
	// Right vertical axis
	canvas1.cx.lineWidth = 1;
	canvas1.cx.beginPath();
	canvas1.cx.moveTo(canvas1.graphRight + canvas1.barSlant + .5,
						canvas1.graphBottom - canvas1.barDepth);
	canvas1.cx.lineTo(canvas1.graphRight + canvas1.barSlant + .5,
						canvas1.graphTop - canvas1.barDepth);
	canvas1.cx.stroke();
	canvas1.cx.font = font.axisNumbers;
	// Left vertical axis and axis numbering
	for ( var i = 0; i < 6; i++ ) {
		var y = canvas1.graphBottom - canvas1.graphHeight*i/5;
		canvas1.cx.fillText(round((max*i/5), 4, 6),
				canvas1.graphLeft - 25, y + 6);
		canvas1.cx.beginPath();
		canvas1.cx.moveTo(canvas1.graphRight + canvas1.barSlant, y - canvas1.barDepth + .5);
		canvas1.cx.lineTo(canvas1.graphLeft + canvas1.barSlant, y - canvas1.barDepth + .5);
		if ( canvas1.threeD )
			canvas1.cx.lineTo(canvas1.graphLeft, y);
		canvas1.cx.stroke();
	}
	canvas1.cx.font = font.axisLabels;
	for ( var i = 0; i < molecules.length; i++ ) {
		canvas1.cx.fillText( molecules[i], canvas1.graphLeft + (canvas1.graphWidth*(2*i + 1 ) )/12, canvas1.graphBottom + 20);
	}
	canvas1.cx.save();
	canvas1.cx.font = font.axisLabels;
	var axisTitle;
	if ( mode == "mole" ) {
		axisTitle = "Amount (moles)";
	}
	else {
		axisTitle = "Mass (g)";
	}
	canvas1.cx.rotate(-Math.PI/2);
	// Careful, everything is rotated
	canvas1.cx.fillText(axisTitle, -canvas1.graphTop-canvas1.graphHeight/2, canvas1.graphLeft-48);
	canvas1.cx.restore();

	// Draw the axis; drawn second so that it is on top of the grid lines
	canvas1.cx.lineWidth = 2;
	canvas1.cx.strokeStyle = color.graphAxis;
	canvas1.cx.beginPath();
	canvas1.cx.moveTo(canvas1.graphLeft, canvas1.graphTop);
	canvas1.cx.lineTo(canvas1.graphLeft, canvas1.graphBottom);
	canvas1.cx.lineTo(canvas1.graphRight, canvas1.graphBottom);
	canvas1.cx.stroke();
}

/*
 * Draw the bar chart legend
 */
function drawBarChartLegend()
{
	canvas1.cx.lineWidth = 1;
	canvas1.cx.font = font.legend;
	canvas1.cx.save()
		// Using translate to ease coding; should have been used in other sections
		canvas1.cx.translate(canvas1.graphLeft + canvas1.graphWidth/2 - 100, canvas1.graphBottom + 25);
		canvas1.cx.beginPath();
		canvas1.cx.rect(0, 0, 200, 30);
		canvas1.cx.stroke();

		canvas1.cx.fillStyle = color.initial;
		canvas1.cx.fillText('Initial', 30, 22);
		canvas1.cx.beginPath();
		canvas1.cx.rect(60, 5, 20, 20);
		canvas1.cx.fill();

		canvas1.cx.fillStyle = color.end;
		canvas1.cx.beginPath();
		canvas1.cx.fillText('End', 130, 22);
		canvas1.cx.beginPath();
		canvas1.cx.rect(155, 5, 20, 20);
		canvas1.cx.fill();
	canvas1.cx.restore();
}

/*
 * Draws a 3D bar on canvas1 or a 2D bar if depth is 0
 *  would be nice if this was implemented with perspective
 *
 * @param left
 *		The location of the left part of the bar (in pixels)
 * @param height
 *		The height of the bar (in pixels)
 * @param width
 *		The width of the bar (in pixels)
 */
function drawBar(left, height, width)
{
	depth = canvas1.barDepth;
	slant = canvas1.barSlant;
	canvas1.cx.beginPath();
	canvas1.cx.rect(left, canvas1.graphBottom, width, -height);
	canvas1.cx.fill();
	canvas1.cx.stroke();
	if ( canvas1.threeD ) {
		// Top
		canvas1.cx.beginPath();
		canvas1.cx.moveTo(left, canvas1.graphBottom - height);
		canvas1.cx.lineTo(left + slant, canvas1.graphBottom - height - depth);
		canvas1.cx.lineTo(left + slant + width, canvas1.graphBottom - height - depth);
		canvas1.cx.lineTo(left + width, canvas1.graphBottom - height);
		canvas1.cx.closePath();
		canvas1.cx.fill();
		canvas1.cx.stroke();
		// Right
		canvas1.cx.beginPath();
		canvas1.cx.moveTo(left + slant + width, canvas1.graphBottom - height - depth);
		canvas1.cx.lineTo(left + slant + width, canvas1.graphBottom - depth);
		canvas1.cx.lineTo(left + width, canvas1.graphBottom);
		canvas1.cx.lineTo(left + width, canvas1.graphBottom - height);
		canvas1.cx.closePath();
		canvas1.cx.fill();
		canvas1.cx.stroke();
	}
}

/*
 * Draws the initial and end bars in the bar chart
 *
 * @param max
 *		The max height that can be achieved by any bar
 */
function drawBarChartBars(max)
{
	canvas1.cx.lineWidth = 1;
	canvas1.cx.fillStyle = color.initial;
	canvas1.cx.strokeStyle = '#222222';
	for ( var i = 0; i < 6; i++ ) {
		if ( mode == "mole" ) {
			drawBar(canvas1.graphLeft+canvas1.graphWidth/6*i+7,
					canvas1.scale*moles[0][i],
					canvas1.graphWidth/12 - 7);
		}
		else {
			drawBar(canvas1.graphLeft+canvas1.graphWidth/6*i+7,
					canvas1.scale*moles[0][i]*molarMass[i],
					canvas1.graphWidth/12 - 7);
		}
	}

	canvas1.cx.lineWidth = 1;
	canvas1.cx.fillStyle = color.end;
	canvas1.cx.strokeStyle = '#222222';
	for ( var i = 0; i < 6; i++ ) {
		if ( mode == "mole" ) {
			drawBar(canvas1.graphLeft+canvas1.graphWidth*(2*i+1)/12,
					canvas1.scale*moles[2][i],
					canvas1.graphWidth/12 - 7);
		}
		else {
			drawBar(canvas1.graphLeft+canvas1.graphWidth*(2*i+1)/12,
				canvas1.scale*moles[2][i]*molarMass[i],
				canvas1.graphWidth/12 - 7);
		}
	}
}

/*
 * Draws the graph and associated writing (eg. legend, axis labels),
 *	and then passes off to the line drawer
 */
function updateGraph()
{
	// Scale the graph so that the highest amount is at the very top
	var max;
	if ( mode == "mole" ) {
		max = Math.max(moles[3][0], moles[3][1], moles[3][2], moles[3][3], moles[3][4], moles[3][5],
						moles[4][0], moles[4][1], moles[4][2], moles[4][3], moles[4][4], moles[4][5]);
	}
	else {
		max = Math.max(moles[3][0]*molarMass[0], moles[3][1]*molarMass[1],
						moles[3][2]*molarMass[2], moles[3][3]*molarMass[3],
						moles[3][4]*molarMass[4], moles[3][5]*molarMass[5],
						moles[4][0]*molarMass[0], moles[4][1]*molarMass[1],
						moles[4][2]*molarMass[2], moles[4][3]*molarMass[3],
						moles[4][4]*molarMass[4], moles[4][5]*molarMass[5]);
	}
	canvas2.scale = canvas2.graphHeight/max;

	// Clear the canvas
	canvas2.cx.clearRect(0, 0, canvas2.width, canvas2.height);

	drawGraphAxis(max)

	drawGraphLegend()

	drawGraphLines();
}

/*
 * Draw graph Axis and labels
 *
 * @param max
 *		The max height that can be achieved by any line
 */
function drawGraphAxis(max)
{
	// Add title and axis labels
	// canvas2.cx.font = font.title;
	// canvas2.cx.fillText('Title', canvas2.graphLeft + canvas2.graphWidth/2, canvas2.graphTop - 30);

	// Add 6 values to bottom and to vertical and draw grid lines
	canvas2.cx.lineWidth = 1;
	canvas2.cx.strokeStyle = color.graphGrid;
	canvas2.cx.fillStyle = '#000000';
	canvas2.cx.font = font.axisNumbers;
	for ( var i = 0; i < 6; i++ ) {
		var x = canvas2.graphLeft + canvas2.graphWidth*i/5;
		canvas2.cx.fillText(
				round((min_extent + (extent_range)*i/5), 4, 6),
				x,
				canvas2.graphBottom + 20);
		canvas2.cx.beginPath();
		canvas2.cx.moveTo(x + .5, canvas2.graphTop);
		canvas2.cx.lineTo(x + .5, canvas2.graphBottom);
		canvas2.cx.stroke();

		var y = canvas2.graphBottom - canvas2.graphHeight*i/5;
		canvas2.cx.fillText(
				round(max*i/5, 4, 6),
				canvas2.graphLeft - 25,
				y + 6);
		canvas2.cx.beginPath();
		canvas2.cx.moveTo(canvas2.graphLeft, y + .5);
		canvas2.cx.lineTo(canvas2.graphRight, y + .5);
		canvas2.cx.stroke();
	}

	// Draw the graph; drawn second so that it is on top of the grid lines
	canvas2.cx.lineWidth = 2;
	canvas2.cx.strokeStyle = '#000000';
	zero_extent = -min_extent/(extent_range)*canvas2.graphWidth + canvas2.graphLeft;
	canvas2.cx.beginPath();
	canvas2.cx.moveTo(zero_extent, canvas2.graphTop);
	canvas2.cx.lineTo(zero_extent, canvas2.graphBottom);
	canvas2.cx.stroke();
	canvas2.cx.beginPath();
	canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom);
	canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom);
	canvas2.cx.stroke();

	canvas2.cx.font = font.axisLabels;
	canvas2.cx.fillText("Extent of Reaction, \u03be (moles)", canvas2.graphLeft + canvas2.graphWidth/2, canvas2.graphBottom + 45);
	var axisTitle;
	if ( mode == "mole" ) {
		axisTitle = "Amount (moles)";
	}
	else {
		axisTitle = "Mass (g)"
	}
	canvas2.cx.save();
	canvas2.cx.rotate(-Math.PI/2);
	// Careful, everything is rotated
	canvas2.cx.fillText(axisTitle, -canvas2.graphTop-canvas2.graphHeight/2, canvas2.graphLeft-48);
	canvas2.cx.restore();
}

/*
 * Adds a legend to the graph
 */
function drawGraphLegend()
{
	// Add legend
	canvas2.cx.lineWidth = 1;
	canvas2.cx.fillStyle = '#000000';
	canvas2.cx.beginPath();
	canvas2.cx.rect(canvas2.graphRight+5, canvas2.graphTop+canvas2.graphHeight/2-75, 53, 133);
	canvas2.cx.stroke();
	canvas2.cx.lineWidth = 2;
	// A
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.A;
	canvas2.cx.font = font.legend;
	canvas2.cx.fillText('A', canvas2.graphRight + 15, canvas2.graphTop + canvas2.graphHeight/2 - 53);
	canvas2.cx.beginPath();
	canvas2.cx.moveTo(canvas2.graphRight+30, canvas2.graphTop + canvas2.graphHeight/2-62);
	canvas2.cx.lineTo(canvas2.graphRight+50, canvas2.graphTop + canvas2.graphHeight/2-62);
	canvas2.cx.stroke();
	// B
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.B;
	canvas2.cx.beginPath();
	canvas2.cx.fillText('B', canvas2.graphRight + 15, canvas2.graphTop + canvas2.graphHeight/2 - 32);
	canvas2.cx.moveTo(canvas2.graphRight+30, canvas2.graphTop + canvas2.graphHeight/2-40);
	canvas2.cx.lineTo(canvas2.graphRight+50, canvas2.graphTop + canvas2.graphHeight/2-40);
	canvas2.cx.stroke();
	// C
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.C;
	canvas2.cx.fillText('C', canvas2.graphRight + 15, canvas2.graphTop + canvas2.graphHeight/2 - 11);
	canvas2.cx.beginPath();
	canvas2.cx.moveTo(canvas2.graphRight+30, canvas2.graphTop + canvas2.graphHeight/2-20);
	canvas2.cx.lineTo(canvas2.graphRight+50, canvas2.graphTop + canvas2.graphHeight/2-20);
	canvas2.cx.stroke();
	// X
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.X;
	canvas2.cx.fillText('X', canvas2.graphRight + 15, canvas2.graphTop + canvas2.graphHeight/2 + 11);
	canvas2.cx.beginPath();
	canvas2.cx.moveTo(canvas2.graphRight+30, canvas2.graphTop + canvas2.graphHeight/2+3);
	canvas2.cx.lineTo(canvas2.graphRight+50, canvas2.graphTop + canvas2.graphHeight/2+3);
	canvas2.cx.stroke();
	// Y
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.Y;
	canvas2.cx.fillText('Y', canvas2.graphRight + 15, canvas2.graphTop + canvas2.graphHeight/2 + 32);
	canvas2.cx.beginPath();
	canvas2.cx.moveTo(canvas2.graphRight+30, canvas2.graphTop + canvas2.graphHeight/2+25);
	canvas2.cx.lineTo(canvas2.graphRight+50, canvas2.graphTop + canvas2.graphHeight/2+25);
	canvas2.cx.stroke();
	// Z
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.Z;
	canvas2.cx.fillText('Z', canvas2.graphRight + 15, canvas2.graphTop + canvas2.graphHeight/2 + 53);
	canvas2.cx.beginPath();
	canvas2.cx.moveTo(canvas2.graphRight+30, canvas2.graphTop + canvas2.graphHeight/2+47);
	canvas2.cx.lineTo(canvas2.graphRight+50, canvas2.graphTop + canvas2.graphHeight/2+47);
	canvas2.cx.stroke();
}

/*
 * Draws the lines corresponding to the amounts of products and reactants
 *	and then passes off to the slider line drawer
 */
function drawGraphLines()
{
	// Draw the individual product and reactant lines
	canvas2.cx.lineWidth = 3;
	// A
	canvas2.cx.beginPath();
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.A;
	if ( mode == 'mole' ) {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom - canvas2.scale*moles[3][0]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom - canvas2.scale*moles[4][0]);
	}
	else {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom -
							canvas2.scale*moles[3][0]*molarMass[0]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom -
							canvas2.scale*moles[4][0]*molarMass[0]);
	}
	canvas2.cx.stroke();
	// B
	canvas2.cx.beginPath();
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.B;
	if ( mode == 'mole' ) {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom - canvas2.scale*moles[3][1]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom - canvas2.scale*moles[4][1]);
	}
	else {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom -
							canvas2.scale*moles[3][1]*molarMass[1]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom -
							canvas2.scale*moles[4][1]*molarMass[1]);
	}
	canvas2.cx.stroke();
	// C
	canvas2.cx.beginPath();
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.C;
	if ( mode == 'mole' ) {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom - canvas2.scale*moles[3][2]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom - canvas2.scale*moles[4][2]);
	}
	else {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom -
							canvas2.scale*moles[3][2]*molarMass[2]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom -
							canvas2.scale*moles[4][2]*molarMass[2]);
	}
	canvas2.cx.stroke();
	// X
	canvas2.cx.beginPath();
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.X;
	if ( mode == 'mole' ) {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom - canvas2.scale*moles[3][3]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom - canvas2.scale*moles[4][3]);
	}
	else {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom -
							canvas2.scale*moles[3][3]*molarMass[3]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom -
							canvas2.scale*moles[4][3]*molarMass[3]);
	}
	canvas2.cx.stroke();
	// Y
	canvas2.cx.beginPath();
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.Y;
	if ( mode == 'mole' ) {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom - canvas2.scale*moles[3][4]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom - canvas2.scale*moles[4][4]);
	}
	else {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom -
							canvas2.scale*moles[3][4]*molarMass[4]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom -
							canvas2.scale*moles[4][4]*molarMass[4]);
	}
	canvas2.cx.stroke();
	// Z
	canvas2.cx.beginPath();
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.Z;
	if ( mode == 'mole' ) {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom - canvas2.scale*moles[3][5]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom - canvas2.scale*moles[4][5]);
	}
	else {
		canvas2.cx.moveTo(canvas2.graphLeft, canvas2.graphBottom -
							canvas2.scale*moles[3][5]*molarMass[5]);
		canvas2.cx.lineTo(canvas2.graphRight, canvas2.graphBottom -
							canvas2.scale*moles[4][5]*molarMass[5]);
	}
	canvas2.cx.stroke();

	updateGraphSlider();
}

/*
 * Updates the position of the red slider on the graph on canavas2
 */
function updateGraphSlider()
{
	// Draw bar up vertically from the extent
	canvas2.cx.fillStyle = canvas2.cx.strokeStyle = color.slider;
	canvas2.cx.beginPath();
	canvas2.cx.moveTo(canvas2.graphLeft + percent_complete/100*canvas2.graphWidth, canvas2.graphTop);
	canvas2.cx.lineTo(canvas2.graphLeft + percent_complete/100*canvas2.graphWidth, canvas2.graphBottom);
	canvas2.cx.stroke();
}

/*
 * Rounds the number to the specified number of significant figures
 *
 * @param num
 *		The number to be rounded
 * @param sigfigs
 *		The desired number of significant figures
 * @param truncate
 *		Specifies after how many decimals the number should be truncated, unless
 *		 it === false, then there is no truncation
 */
function round(num, sigfigs, truncate)
{
	// If truncate is literally false (ie. it is not 0 or other values that are equivalent to false)
	if ( truncate !== false ) {
		return Math.round(num.toPrecision(sigfigs)*Math.pow(10, truncate))/Math.pow(10, truncate);
	}
	return num.toPrecision(sigfigs);
}
