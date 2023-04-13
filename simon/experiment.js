/*
Simon task
*/

var pav = false;

var randomDraw = function(lst) {
	var index = Math.floor(Math.random() * (lst.length))
	return lst[index]
}


/* ************************************ */
/* Define experimental variables */
/* ************************************ */
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds

// task specific variables
var current_trial = 0

var num_practice_trials = 4 //per trial type
var blocks = jsPsych.randomization.shuffle(['B'])

var factors = { 
	difficulty: ["congruent","incongruent"],
	type: ["blue","orange"]
}


var nstimuli = factors.type.length * factors.difficulty.length;
var total_trials_per_block = 200;
var trial_reps_per_block = total_trials_per_block / nstimuli;

var total_practice_trials = 20;
var trial_reps_practice = total_practice_trials / nstimuli;
var practice_design = jsPsych.randomization.factorial(factors,trial_reps_practice,true);
var initial_full_design = jsPsych.randomization.factorial(factors,trial_reps_per_block,true);

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
var feedback_instruct_text =
	'<div class="block-text">Welcome to the experiment. Press <strong>enter</strong> to begin.</div>'
	
var getInstructFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>'
}

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
		'<div class = centerbox><p class = block-text>In this task, you will be shown stimuli consisting of colored circles on the left or right of the screen. Your job is to press a button based on the color of the circle.</p></div>',
	],
	allow_keys: false,
	show_clickable_nav: true,
	button_label_previous: 'Previous Page',
	button_label_next: 'Next Page',
	timing_post_trial: 1000,
	key_forward: jsPsych.NO_KEYS,
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



var audio = new Audio();
audio.src = "error.mp3";
audio.loop = false;

jsPsych.pluginAPI.preloadAudio(audio.src);

function errorDing() {
	audio.play();
}

//Set up experiment
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

experiment_timeline.push(instruction_node);


function generate_stimuli(difficulty,type) {
	var side = 'left';
	
	gridtext = '<div class="centerbox"><div class="container">';
	
	var stim = '<div class="simon ' + type + '"></div>';
	if (difficulty=="congruent") {
		if (type=="orange") {
			side = "right";
			gridtext = gridtext + '<div class=g1></div><div class=g2></div><div class=g3>' + stim + '</div>';
		} else {
			side = "left";
			gridtext = gridtext + '<div class=g1>' + stim + '</div><div class=g2></div><div class=g3></div>';
		}
	} else {
		if (type=="orange") {
			side = "left";
			gridtext = gridtext + '<div class=g1>' + stim + '</div><div class=g2></div><div class=g3></div>';
		} else {
			side = "right";
			gridtext = gridtext + '<div class=g1></div><div class=g2></div><div class=g3>' + stim + '</div>';
		}
	}
	gridtext = gridtext + '</div></div>';
	return [gridtext,side];
}

function create_trial(difficulty,type,practice) {
	var [gridtext,side] = generate_stimuli(difficulty,type);
	
	var correct_response = 190;
	if (type=="orange") {
		correct_response = 188;
	}
	
	var correct_text = '<div class = centerbox><div style="color:green;font-size:60px"; class = block-text>Correct!</div></div>';
	var incorrect_text = '<div class = centerbox><div style="color:red;font-size:60px"; class = block-text>Incorrect</div></div>';
	var feedback_duration = 1000;
	var fixation_duration = 500;
	var trial_id = "grid_practice";
	if (practice==0) {
		trial_id = "simon";
		correct_text = '';
		//incorrect_text = '';
		feedback_duration = 300;
		fixation_duration = 200;
	}
	
	var stim_block = {
			type: 'poldrack-categorize',
			is_html: true,
			stimulus: '<div class=centerbox>' + gridtext + '</div>',
			data: {
				trial_id: trial_id,
				stim: gridtext,
				side: side,
				correct_response: correct_response,
				difficulty: difficulty,
				type: type
			},
			choices: [',','<','.','>'],
			key_answer: correct_response,
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

var b_instructions = []
var [example_stim1,number] = generate_stimuli("congruent","blue");
var [example_stim2,number] = generate_stimuli("incongruent","blue");
var [example_stim3,number] = generate_stimuli("congruent","blue");
var [example_stim4,number] = generate_stimuli("congruent","orange");
var [example_stim5,number] = generate_stimuli("incongruent","orange");
var [example_stim6,number] = generate_stimuli("congruent","orange");

var b_task_instructions_1 = {
	type: 'instructions',
	pages: [
		'<div class = centerbox><p class = block-text>If the circle is <b class="b">BLUE</b> press the <b>LEFT</b> arrow key. If the circle is <b class="o">ORANGE</b> then press the <b>RIGHT</b> arrow key.</p><p class=block-text>The following three example stimuli are <b class="b">BLUE</b>.</p></div>',
		'<div class=centerbox>' + example_stim1 + '<br/><br/><br/><p class=center-block-text>Press Next to see the next example.</p></div>',
		'<div class=centerbox>' + example_stim2 + '<br/><br/><br/><p class=center-block-text>Press Next to see the next example.</p></div>',
		'<div class=centerbox>' + example_stim3 + '<br/><br/><br/><p class=center-block-text>Press Next to continue instructions.</p></div>',
		'<div class = centerbox><p class = block-text>The following three stimuli are <b class="o">ORANGE</b>.</p></div>',
		'<div class=centerbox>' + example_stim4 + '<br/><br/><br/><p class=center-block-text>Press Next to see the next example.</p></div>',
		'<div class=centerbox>' + example_stim5 + '<br/><br/><br/><p class=center-block-text>Press Next to see the next example.</p></div>',
		'<div class=centerbox>' + example_stim6 + '<br/><br/><br/><p class=center-block-text>Press Next to continue instructions.</p></div>',
	],
	show_clickable_nav: true,
	button_label_previous: 'Previous Page',
	button_label_next: 'Next Page',
	data: {
		trial_id: "simon task instructions 1"
	},
	timing_post_trial: 1000,
	key_forward: jsPsych.NO_KEYS,
	key_backward: jsPsych.NO_KEYS
};

var b_task_instructions_2 = {
	type: 'instructions',
	pages: [
		'<div class = centerbox ><p class = block-text>When presented with the stimulus, you should press the <b>LEFT</b> arrow key for <b class="b">BLUE</b> or the <b>RIGHT</b> arrow key for <b class="o">ORANGE</b>. Try to make your responses quickly. If you respond too slowly, you will receive a feedback message that says "Respond faster!".</p><p class=block-text>The following round contains 20 practice trials.</p><p class=center-block-text>Press <b>ENTER</b> to begin practice.</div>'
	],
	key_forward: 'Enter',
	data: {
		trial_id: "simon task instructions 2"
	},
	timing_post_trial:1000
};

var b_task_instructions_4 = {
	type: 'instructions',
	pages: [
		'<div class = centerbox><p class = block-text>The next round contains more trials in which you will have to press a key based on the color of the circle. Unlike the practice block you just completed, you will not receive any feedback if your choice is correct. If your choice is incorrect or you do not respond quickly enough you will see feedback. Try your best to respond quickly and accurately on each trial.</p><p class=center-block-text>Press <b>ENTER</b> to begin task.</p></div>'
	],
	key_forward: 'Enter',	
	data: {
		trial_id: "simon task instructions 4"
	},
	timing_post_trial: 1000
};

b_instructions.push(b_task_instructions_1);
b_instructions.push(b_task_instructions_2);
b_instructions.push(cursor_off);

//insert practice trials
var practice = [];
for (i = 0; i<total_practice_trials; i++) {
	var difficulty = practice_design.difficulty[i];
	var type = practice_design.type[i];
	practice = practice.concat(create_trial(difficulty,type,1));
}
b_instructions = b_instructions.concat(practice);
b_instructions.push(cursor_on);
b_instructions.push(b_task_instructions_4);

experiment_timeline = experiment_timeline.concat(b_instructions);

experiment_timeline.push(cursor_off);


for (var d = 0; d < blocks.length; d++) {
	var block = blocks[d]

	//experiment_timeline = experiment_timeline.concat(instructions);
	
	for (var i = 0; i < total_trials_per_block; i++) {
		var difficulty = initial_full_design.difficulty[i];
		var type = initial_full_design.type[i];
		var trial = create_trial(difficulty,type,0);
		experiment_timeline = experiment_timeline.concat(trial);
	}
	//experiment_timeline.push(interblock_rest);
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
		exp_id: 'simon'
	},
	stimulus: '<div class=centerbox><p class=block-text>You have finished the task. </p><p class=block-text>Please wait and you will be redirected to complete the survey.</p></div>',
	choices: jsPsych.NO_KEYS,
	trial_duration: 4000
};

experiment_timeline.push(end_block)
