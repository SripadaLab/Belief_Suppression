/* ************************************ */
/* Define helper functions */
/* ************************************ */
function assessPerformance() {
	var experiment_data = jsPsych.data.getTrialsOfType('poldrack-single-stim')
	experiment_data = experiment_data.concat(jsPsych.data.getTrialsOfType('poldrack-categorize'))
	var missed_count = 0
	var trial_count = 0
	var rt_array = []
	var rt = 0
		//record choices participants made
	var choice_counts = {}
	choice_counts[-1] = 0
	for (var k = 0; k < choices.length; k++) {
		choice_counts[choices[k]] = 0
	}
	for (var i = 0; i < experiment_data.length; i++) {
		if (experiment_data[i].possible_responses != 'none') {
			trial_count += 1
			rt = experiment_data[i].rt
			key = experiment_data[i].key_press
			choice_counts[key] += 1
			if (rt == -1) {
				missed_count += 1
			} else {
				rt_array.push(rt)
			}
		}
	}
	//calculate average rt
	var avg_rt = -1
	if (rt_array.length !== 0) {
		avg_rt = math.median(rt_array)
	} 
	//calculate whether response distribution is okay
	var responses_ok = true
	Object.keys(choice_counts).forEach(function(key, index) {
		if (choice_counts[key] > trial_count * 0.85) {
			responses_ok = false
		}
	})
	var missed_percent = missed_count/trial_count
	credit_var = (missed_percent < 0.4 && avg_rt > 200 && responses_ok)
	jsPsych.data.addDataToLastTrial({"credit_var": credit_var})
}

var getInstructFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>'
}

var randomDraw = function(lst) {
  var index = Math.floor(Math.random() * (lst.length))
  return lst[index]
}

var getStim = function() {
	var trial_type = trial_types.pop()
	var probe_i = randomDraw([1,2,3,4,5,6,7,8,9,10])
	var target_i = 0
	if (trial_type[0] == 'S') {
		target_i = probe_i
		if (trial_type[1] == 'T') {
			currData.correct_response = 37
		} else {
			currData.correct_response = 40
		}
	} else {
		target_i = randomDraw([1,2,3,4,5,6,7,8,9,10].filter(function(y) {return y != probe_i}))
		if (trial_type[1] == 'T') {
			currData.correct_response = 40
		} else {
			currData.correct_response = 37
		}
	}
	var textprompt = ''
	if (trial_type[1] == 'T') {
		textprompt = '<div class = centerbox><p class="prompt truth">Do they match?</div>'
	} else {
		textprompt = '<div class = centerbox><p class="prompt lie">Do they match?</div>'
	}
	
	currData.trial_num = current_trial
	currData.condition = trial_type
	currData.probe_id = probe_i
	currData.target_id = target_i
	var target = '<div class = leftbox>'+center_prefix+path+target_i+'_white.png'+postfix+'</div>'
	var probe = '<div class = rightbox>'+center_prefix+path+probe_i+'_white.png'+postfix+'</div>'
	current_trial += 1
	var stim = textprompt + target  + probe 
	return stim
}

var getData = function() {
	currData.exp_stage = exp_stage
	return currData
}

var getResponse = function() {
	return currData.correct_response
}
/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds
var credit_var = 0

// task specific variables
// Set up variables for stimuli
//var colors = ['white','red','green']
var colors = ['white']
var path = 'images/'
var center_prefix = '<div class = centerimg><img src = "'
var mask_prefix = '<div class = "centerimg mask"><img src = "'
var postfix = '"></div>'
var shape_stim = []
var exp_stage = 'practice'
var currData = {'trial_id': 'stim'}
var current_trial = 0

for (var i = 1; i<11; i++) {
	for (var c = 0; c<1; c++) {
		shape_stim.push(path + i + '_' + colors[c] + '.png')
	}
}
jsPsych.pluginAPI.preloadImages(shape_stim.concat(path+'mask.png'))

var practice_len = 8
// Trial types denoted by three letters for the relationship between:
// probe-target, target-distractor, distractor-probe of the form
// SDS where "S" = match and "D" = non-match, N = "Neutral"
var trial_types = jsPsych.randomization.repeat(['ST', 'DT', 'SL','DL'],practice_len/4)
var exp_len = 8
var numblocks = 1
var choices = [37,40]

/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */

//Set up post task questionnaire
var post_task_block = {
   type: 'survey-text',
   data: {
       trial_id: "post task questions"
   },
   questions: ['<p class = center-block-text style = "font-size: 20px">Please summarize what you were asked to do in this task.</p>',
              '<p class = center-block-text style = "font-size: 20px">Do you have any comments about this task?</p>'],
   rows: [15, 15],
   columns: [60,60]
};

/* define static blocks */
var response_keys =
	'<ul list-text><li><span class = "large" style = "color:red">WORD</span>: "R key"</li><li><span class = "large" style = "color:blue">WORD</span>: "B key"</li><li><span class = "large" style = "color:green">WORD</span>: "G key"</li></ul>'

var audio = new Audio();
audio.src = "error.mp3";
audio.loop = false;

function errorDing() {
	audio.play();
}


var feedback_instruct_text =
	'Welcome to the experiment. This experiment will take less than 20 minutes. Press <strong>enter</strong> to begin.'
var feedback_instruct_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "instruction"
	},
	cont_key: [13],
	text: getInstructFeedback,
	timing_post_trial: 0,
	timing_response: 180000
};
/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.
var instructions_block = {
	type: 'poldrack-instructions',
	data: {
		trial_id: "instruction"
	},
	pages: [
		'<div class = centerbox><p class = block-text>In this experiment you will see white shapes on the right and left of the screen along with a prompt asking if the shapes match. When the prompt is in <b style="color: green">GREEN</b> text, your task is to press the <b>LEFT</b> arrow key if they are the same shape and the <b>DOWN</b> arrow key if they are different.</p><p class = block-text>On some trials the prompt text will be in <b style="color:red">RED</b>. This indicates that you should lie about whether the shapes match. So if the text is red and the shapes match you would press the <b>DOWN</b> arrow indicating that they do not match. If the text is red and the shapes do not match you would press the <b>LEFT</b> arrow indicating that they do match.</p><p class = block-text>We will start with practice after you finish the instructions.</p></div>'
	],
	allow_keys: false,
	show_clickable_nav: true,
	timing_post_trial: 1000
};

var instruction_node = {
	timeline: [feedback_instruct_block, instructions_block],
	/* This function defines stopping criteria */
	loop_function: function(data) {
		for (i = 0; i < data.length; i++) {
			if ((data[i].trial_type == 'poldrack-instructions') && (data[i].rt != -1)) {
				rt = data[i].rt
				sumInstructTime = sumInstructTime + rt
			}
		}
		if (sumInstructTime <= instructTimeThresh * 1000) {
			feedback_instruct_text =
				'Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <strong>enter</strong> to continue.'
			return true
		} else if (sumInstructTime > instructTimeThresh * 1000) {
			feedback_instruct_text = 'Done with instructions. Press <strong>enter</strong> to continue.'
			return false
		}
	}
}

var end_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "end",
    	exp_id: 'shape_matching'
	},
	timing_response: 180000,
	text: '<div class = centerbox><p class = center-block-text>Thanks for completing this task!</p><p class = center-block-text>Press <strong>enter</strong> to continue.</p></div>',
	cont_key: [13],
	timing_post_trial: 0,
	on_finish: assessPerformance
};

var start_test_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "instruction"
	},
	timing_response: 180000,
	text: '<div class = centerbox><p class = center-block-text>We will now start the test. Respond exactly like you did during practice. There will be three short breaks throughout the test.</p><p class = center-block-text>Press <strong>enter</strong> to begin the test.</p></div>',
	cont_key: [13],
	timing_post_trial: 1000,
	on_finish: function() {
		current_trial = 0
		exp_stage = 'test'
		trial_types = jsPsych.randomization.repeat(['ST', 'DT','SL','DL'],exp_len/4)
	}
};

var rest_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "instruction"
	},
	timing_response: 180000,
	text: '<div class = centerbox><p class = center-block-text>Take a short break!</p><p class = center-block-text>Press <strong>enter</strong> to continue the test.</p></div>',
	cont_key: [13],
	timing_post_trial: 1000
};

var fixation_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><div class = fixation>+</div></div>',
	is_html: true,
	choices: 'none',
	data: {
		trial_id: "fixation"
	},
	timing_response: 500,
	timing_post_trial: 0,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({'exp_stage': exp_stage})
	},
}

var mask_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = "leftbox">'+mask_prefix+path+'mask.png'+postfix+'</div>' +
		'<div class = "rightbox">'+mask_prefix+path+'mask.png'+postfix+'</div>',
	is_html: true,
	choices: 'none',
	data: {
		trial_id: "mask"
	},
	timing_response: 400,
	timing_post_trial: 500,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({'exp_stage': exp_stage})
	},
}

var practice_block = {
	type: 'poldrack-categorize',
	stimulus: getStim,
	is_html: true,
	choices: choices,
	key_answer: getResponse,
	data: getData,
	//correct_text: '<div class = fb_box><div class = center-text><font size = 20>Correct!</font></div></div>',
	//incorrect_text: '<div class = fb_box><div class = center-text><font size = 20>Incorrect</font></div></div>',
	//timeout_message: '<div class = fb_box><div class = center-text><font size = 20>Respond Faster!</font></div></div>',
	correct_text: '<div class = centerbox><div style="color:green;font-size:60px"; class = center-text>Correct!</div></div>',
	incorrect_text: '<div class = centerbox><div style="color:red;font-size:60px"; class = center-text>Incorrect</div></div><script type="text/javascript">errorDing()</script>',
	timeout_message: '<div class = centerbox><div style="font-size:60px" class = center-text>Respond Faster!</div></div>',
	response_ends_trial: true,
	timing_response: 3000,
	timing_feedback_duration: 500,
	show_stim_with_feedback: false,
	timing_post_trial: 0,
	//prompt: '<div class = centerbox><p class = block-text><br><br>Press the left arrow if the shapes are the same. Otherwise press the down arrow.</p></div>.'
	prompt: ''
}

var decision_block = {
	type: 'poldrack-categorize',
	stimulus: getStim,
	is_html: true,
	choices: choices,
	key_answer: getResponse,
	timing_response: 3000,
	data: getData,
	correct_text: '',
	incorrect_text: '<script type="text/javascript">errorDing()</script>',
	timeout_message: '<div class = centerbox><div class = center-text>Respond Faster!</div></div>',
	only_timeout_feedback: true,
	show_stim_with_feedback: false,
	timing_feedback_duration: 500,
	response_ends_trial: true,
	timing_post_trial: 0,
	on_finish: function(data) {
		//correct = false
		//if (data.key_press == data.correct_response) {
		//	correct = true
		//}
		//jsPsych.data.addDataToLastTrial({'correct': correct})
	}
}

/* create experiment definition array */
shape_matching_experiment = []
shape_matching_experiment.push(instruction_node)
for (var i = 0; i < practice_len; i ++) {
	shape_matching_experiment.push(fixation_block)
	shape_matching_experiment.push(practice_block)
	//shape_matching_experiment.push(mask_block)
}
shape_matching_experiment.push(start_test_block)
for (var b = 0; b < numblocks; b++) {
	for (var i = 0; i < exp_len/numblocks; i ++) {
		shape_matching_experiment.push(fixation_block)
		shape_matching_experiment.push(decision_block)
		//shape_matching_experiment.push(mask_block)
	}
	if (b < (numblocks-1)) {
		shape_matching_experiment.push(rest_block)
	}
}
shape_matching_experiment.push(post_task_block)
shape_matching_experiment.push(end_block)