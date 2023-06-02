/* ************************************ */
/* Define helper functions */
/* ************************************ */

var pav = false;

var getInstructFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>';
}

var randomDraw = function(lst) {
  var index = Math.floor(Math.random() * (lst.length));
  return lst[index];
}

var getMathFact = function(t) {
	var x = 0;
	var y = 0;
	var z = 0;
	//adjusted to be 10 or less total
	x = randomDraw([1,2,3,4,5,6,7,8,9]);
	y = randomDraw([1,2,3,4,5,6,7,8,9].filter(function(y) {return (y != x) & (y+x<=10)}));
	if (t==1) {
		//true math fact 
		z = x + y;
	} else {
		//false math fact, randomly jitter x and y by 
		z = 11;
		while (z>10) {
			var jx = randomDraw([-1,0,1]);
			var jy = randomDraw([-1,0,1].filter(function(y) { return y != -1*jx}));
			z = x+jx+y+jy;
		}
	}
	return [x,y,z];
}

var getStim = function() {
	currData = {'trial_id':'stim','exp_stage':exp_stage};
	//currData.exp_stage = exp_stage;
	
	var trial_type = trial_types.pop();
	var math;
	if (trial_type[0] == 'S') {
		//generate a random true math fact
		math = getMathFact(1);
		if (trial_type[1] == 'T') {
			currData.correct_response = 't';
		} else {
			currData.correct_response = 'f';
		}
	} else {
		//generate a random false math fact
		math = getMathFact(0);
		//target_i = randomDraw([1,2,3,4,5,6,7,8,9,10].filter(function(y) {return y != probe_i}))
		if (trial_type[1] == 'T') {
			currData.correct_response = 'f';
		} else {
			currData.correct_response = 't';
		}
	}
	var textprompt = '';
	var truthclass = 'truth';
	var lieclass = 'lie';
	if (currData.exp_stage === "practice1") {
		truthclass = "";
		lieclass = "";
	}
	if (trial_type[1] == 'T') {
		textprompt = '<div class = centerbox><p class="prompt ' + truthclass + '">Is it correct?</div>';
	} else {
		textprompt = '<div class = centerbox><p class="prompt ' + lieclass + '">Is it correct?</div>';
	}
	
	currData.trial_num = current_trial+1;
	currData.condition = trial_type;
	//currData.probe_id = probe_i
	//currData.target_id = target_i
	var target = '<div class = "bigtext g1">' + math[0] + ' + ' + '</div>';
	var probe = '<div class = "bigtext g2">' + math[1] + ' = ' + '</div>';
	var problem = '<div class = "bigtext g3">' + math[2] + '</div>';
	current_trial += 1;
	//var stim = textprompt + '<div class=bigtext>' + target + probe + problem + '</div>';
	var stim = textprompt + '<div class=container>' + target  + probe + problem + '</div>';
	return [stim, currData];
}

//var getData = function() {
//	currData.exp_stage = exp_stage;
//	return structuredClone(currData);
//}

//var getResponse = function() {
//	return currData.correct_response;
//}

/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var sumInstructTime = 0; //ms
var instructTimeThresh = 0; ///in seconds
var credit_var = 0;

// task specific variables
// Set up variables for stimuli
//var colors = ['white','red','green']
var colors = ['white'];
var path = 'images/';
var center_prefix = '<div class = centerimg><img src = "';
var mask_prefix = '<div class = "centerimg mask"><img src = "';
var postfix = '"></div>';
var shape_stim = [];
var exp_stage = 'practice1';
//var currData = {'trial_id': 'stim'};
var current_trial = 0;

for (var i = 1; i<11; i++) {
	for (var c = 0; c<1; c++) {
		shape_stim.push(path + i + '_' + colors[c] + '.png');
	}
}
jsPsych.pluginAPI.preloadImages(shape_stim.concat(path+'mask.png'));

var practice_len = 20
// Trial types denoted by three letters for the relationship between:
// probe-target, target-distractor, distractor-probe of the form
// SDS where "S" = match and "D" = non-match, N = "Neutral"
var trial_types = jsPsych.randomization.repeat(['ST', 'DT', 'SL','DL'],practice_len/4);
var exp_len = 240;
var numblocks = 1;
var choices = ['t','f'];

/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */

//Set up post task questionnaire
var post_task_block = {
   type: 'survey-text',
   data: {
       trial_id: "post task questions"
   },
   questions: [
   { 
	prompt: '<p class = center-block-text style = "font-size: 20px">Please summarize what you were asked to do in this task.</p>',
	rows: 3,
	colums: 30
   }
   ]
};

/* define static blocks */

var audio = new Audio();
audio.src = "error.mp3";
audio.loop = false;

function errorDing() {
	audio.play();
}

var feedback_instruct_text =
	'<div class="block-text">Welcome to the experiment. Press <strong>enter</strong> to begin.</div>'
	

var feedback_instruct_block = {
	type: 'instructions',
	data: {
		trial_id: "instruction"
	},
	key_forward: 'Enter',	pages: [getInstructFeedback()],
	timing_post_trial: 0,
};

/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.
var instructions_block = {
	type: 'instructions',
	data: {
		trial_id: "instruction"
	},
	pages: [
		'<div class = centerbox><p class = block-text>In this experiment you will see simple math problems on the screen along with a prompt asking if the problem is correct. </p><p class = block-text>If the math problem is correct, press the <b>T</b> key. If it is not correct, press the <b>F</b> key.</p><p class = block-text>Press <b>Enter</b> to start a short practice.</p></div>'
	],
	allow_keys: true,
	show_clickable_nav: false,
	timing_post_trial: 1000,
	key_forward: 'Enter',
	key_backward: jsPsych.NO_KEYS
};

var instruction_node = {
	timeline: [feedback_instruct_block, instructions_block],
	/* This function defines stopping criteria */
	loop_function: function(data) {
		for (i = 0; i < data.values().length; i++) {
			if ((data.values()[i].trial_type == 'instructions') && (data.values()[i].rt != -1)) {
				rt = data.values()[i].rt
				sumInstructTime = sumInstructTime + rt
			}
		}
		if (sumInstructTime <= instructTimeThresh * 1000) {
			feedback_instruct_text =
				'<div class="block-text">Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <strong>enter</strong> to continue.</div>'
			return true
		} else if (sumInstructTime > instructTimeThresh * 1000) {
			feedback_instruct_text = '<div class="block-text">Done with instructions. Press <strong>enter</strong> to continue.</div>'
			return false
		}
	}
}

var cursor_off = {
	type: 'call-function',
	func: function() {
		document.body.style.cursor = "none";
	}
}
var cursor_on = {
	type: 'call-function',
	func: function() {
		document.body.style.cursor = "auto";
	}
}

var experiment_timeline = []

if (pav) {
	var pavlovia_init = {
		type: "pavlovia",
		command: "init"
	};
	experiment_timeline.push(pavlovia_init);
};

var fullscreen = {
	type: 'fullscreen',
	fullscreen_mode: true
};
experiment_timeline.push(fullscreen);


function create_trial(practice) {
	
	var correct_text = '<div class = centerbox><div style="color:white;font-size:60px"; class = block-text>Correct!</div></div>';
	var incorrect_text = '<div class = centerbox><div style="color:white;font-size:60px"; class = block-text>Incorrect</div></div>';
	var feedback_duration = 1000;
	var fixation_duration = 500;
	var trial_id = "practice";
	if (practice==0) {
		trial_id = "math";
		correct_text = '';
		//incorrect_text = '';
		feedback_duration = 300;
		fixation_duration = 200;
	}
	
	var stim;
	var currData;
	var tmp = getStim();
	stim = tmp[0];
	currData = tmp[1];
	
	var stim_block = {
			type: 'poldrack-categorize',
			is_html: true,
			data: currData,
			stimulus: stim,
			choices: ['t','f'],
			key_answer: currData.correct_response,
			response_ends_trial: true,
			correct_text: correct_text,
			incorrect_text: incorrect_text,
			timeout_message: '<div class = centerbox><div style="font-size:60px" class = block-text>Respond Faster!</div></div>',
			timing_feedback_duration: feedback_duration,
			show_stim_with_feedback: false,
			timing_stim: 3000,
			timing_response: 3000,
			timing_post_trial: 0
	};
	
	var fixation_block = {
			type: 'html-keyboard-response',
			stimulus: '<div class=centerbox><div style="font-size:60px;" class="block-text">+</div></div>',
			choices: jsPsych.NO_KEYS,
			data: {
				trial_id: "fixation"
			},
			stimulus_duration: fixation_duration,
			trial_duration: fixation_duration
	};
	
	var trial = [];
	trial.push(stim_block);
	trial.push(fixation_block);
	return trial;
}

var instructions_block_2 = {
	type: 'instructions',
	data: {
		trial_id: "instruction"
	},
	pages: [
		'<div class = centerbox><p class = block-text>Now there will be one more instruction. When the prompt question text is in <b style="color: green">GREEN</b> text, your task is to give the answer you think is correct, just like you did in the prior trials. So you will press the <b>T</b> key if the math problem is correct and the <b>F</b> key if it is incorrect like you just did.</p><p class = block-text>But on some trials the prompt question text will be in <b style="color:red">RED</b>. This indicates that you should <b>lie</b> about whether the math problem is correct -- you should give the opposite of what you think the correct answer is. So if the text is red and the math problem is correct you would press the <b>F</b> key -- lying and indicating that it is incorrect. If the text is red and the math problem is not correct you would press the <b>T</b> key -- lying and indicating that it is correct.</p><p class = block-text>Press <b>Enter</b> to start a short practice.</p></div>'
	],
	allow_keys: true,
	show_clickable_nav: false,
	timing_post_trial: 1000,
	key_forward: 'Enter',
	key_backward: jsPsych.NO_KEYS
};


var start_test_block = {
	type: 'html-keyboard-response',
	data: {
		trial_id: "instruction"
	},
	timing_response: 180000,
	stimulus: '<div class = centerbox><p class = block-text>We will now start the test. The task will be the same as the practice you just completed, except that you will not see feedback if you are correct, feedback will only be given if you are incorrect or do not respond quickly enough. </p><p class = center-block-text>Press <strong>enter</strong> to begin the test.</p></div>',
	choices: ['Enter'],
	key_answer: 13,
	timing_post_trial: 1000
};


experiment_timeline.push(instruction_node);
experiment_timeline.push(cursor_off);
//practice with no color cues
current_trial = 0;
trial_types = jsPsych.randomization.repeat(['ST', 'DT'],practice_len/2);
for (var i = 0; i < practice_len; i ++) {
	experiment_timeline = experiment_timeline.concat(create_trial(1))
}
experiment_timeline.push(cursor_on);
//instructions about lying task
experiment_timeline.push(instructions_block_2);
experiment_timeline.push(cursor_off);
//practice with color cues
exp_stage = 'practice2'
current_trial = 0;
trial_types = jsPsych.randomization.repeat(['ST', 'DT','SL','DL'],practice_len/4);
for (var i = 0; i < practice_len; i ++) {
	experiment_timeline = experiment_timeline.concat(create_trial(1))
}
experiment_timeline.push(cursor_on);
//start task screen
experiment_timeline.push(start_test_block);
experiment_timeline.push(cursor_off);
//task
current_trial = 0;
exp_stage = 'test';
trial_types = jsPsych.randomization.repeat(['ST', 'DT','SL','DL'],exp_len/4);

for (var b = 0; b < numblocks; b++) {
	for (var i = 0; i < exp_len/numblocks; i ++) {
		experiment_timeline = experiment_timeline.concat(create_trial(0))
	}
	if (b < (numblocks-1)) {
		experiment_timeline.push(rest_block)
	}
}

experiment_timeline.push(cursor_on);

experiment_timeline.push(post_task_block)

if (pav) {
	var pavlovia_finish = {
		type: "pavlovia",
		command: "finish",
	};
	experiment_timeline.push(pavlovia_finish);
};

var pause = {
	type: 'html-keyboard-response',
	stimulus: '<div class=centerbox><p class=center-block-text>Please wait...</p></div>',
	choices: jsPsych.NO_KEYS,
	trial_duration: 6000
};
experiment_timeline.push(pause);

var no_fullscreen = {
	type: "fullscreen",
	fullscreen_mode: false
};

experiment_timeline.push(no_fullscreen);


var end_block = {
	type: 'html-keyboard-response',
	data: {
		trial_id: "end",
		exp_id: 'numerosity'
	},
	stimulus: '<div class=centerbox><p class=block-text>You have finished the task. </p><p class=block-text>Please wait and you will be redirected to complete the survey.</p></div>',
	choices: jsPsych.NO_KEYS,
	trial_duration: 4000
};

experiment_timeline.push(end_block)
