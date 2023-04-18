/**
 * jspsych plugin for categorization trials with feedback
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 * 
 * Modified by Ian Eisenberg to record more trial parameters
 **/


jsPsych.plugins["poldrack-categorize"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('animation', 'stimulus', 'image');

  plugin.info = {
    name: 'poldrack-categorize',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The HTML content to be displayed.'
      },
      key_answer: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Key answer',
        default: undefined,
        description: 'The key to indicate the correct response.'
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Choices',
        default: jsPsych.ALL_KEYS,
        array: true,
        description: 'The keys the subject is allowed to press to respond to the stimulus.'
      },
      text_answer: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Text answer',
        default: null,
        description: 'Label that is associated with the correct answer.'
      },
      correct_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Correct text',
        default: "<p class='feedback'>Correct</p>",
        description: 'String to show when correct answer is given.'
      },
      incorrect_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Incorrect text',
        default: "<p class='feedback'>Incorrect</p>",
        description: 'String to show when incorrect answer is given.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the stimulus.'
      },
      force_correct_button_press: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Force correct button press',
        default: false,
        description: 'If set to true, then the subject must press the correct response key after feedback in order to advance to next trial.'
      },
      show_stim_with_feedback: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true,
        no_function: false,
        description: ''
      },
      show_feedback_on_timeout: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Show feedback on timeout',
        default: false,
        description: 'If true, stimulus will be shown during feedback. If false, only the text feedback will be displayed during feedback.'
      },
      timeout_message: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Timeout message',
        default: "<p>Please respond faster.</p>",
        description: 'The message displayed on a timeout non-response.'
      },
	  is_html: {
		  type: jsPsych.plugins.parameterType.BOOL,
		  pretty_name: 'Is HTML',
		  default: true,
		  description: 'Is the trial HTML or not.'
	  },
	  response_ends_trial: {
		  type: jsPsych.plugins.parameterType.BOOL,
		  pretty_name: 'Response Ends Trial',
		  default: false,
		  description: 'Does the response end the trial.'
	  },
	  timing_stim: {
		  type: jsPsych.plugins.parameterType.INT,
		  pretty_name: 'Stimulus duration',
		  default: null,
		  description: 'How long to show stimulus.'
	  },
	  timing_response: {
		  type: jsPsych.plugins.parameterType.INT,
		  pretty_name: 'Trial duration',
		  default: null,
		  description: 'How long to show trial.'
	  },
	  timing_feedback_duration: {
		  type: jsPsych.plugins.parameterType.INT,
		  pretty_name: 'Feedback duration',
		  default: 2000,
		  description: 'How long to show feedback.'
	  },
	  timing_post_trial: {
		  type: jsPsych.plugins.parameterType.INT,
		  pretty_name: 'Post trial interval',
		  default: 1000,
		  description: 'Timing after the trial ends.'
	  },
	  only_timeout_feedback: {
		  type: jsPsych.plugins.parameterType.BOOL,
		  pretty_name: 'Only timeout feedback',
		  default: false,
		  description: 'Only show feedback on timeout.'
	  },
	  incorrect_audio: {
		  type: jsPsych.plugins.parameterType.STRING,
		  pretty_name: 'Incorrect audio file',
		  default: null,
		  description: 'Audio file to play on incorrect.'
	  }
    }
  }

  plugin.trial = function(display_element, trial) {

    // default parameters
    //trial.text_answer = (typeof trial.text_answer === 'undefined') ? "" : trial.text_answer;
    //trial.correct_text = (typeof trial.correct_text === 'undefined') ? "<p class='feedback'>Correct</p>" : trial.correct_text;
    //trial.incorrect_text = (typeof trial.incorrect_text === 'undefined') ? "<p class='feedback'>Incorrect</p>" : trial.incorrect_text;
    //trial.show_stim_with_feedback = (typeof trial.show_stim_with_feedback === 'undefined') ? true : trial.show_stim_with_feedback;
    //trial.is_html = (typeof trial.is_html === 'undefined') ? false : trial.is_html;
    //trial.force_correct_button_press = (typeof trial.force_correct_button_press === 'undefined') ? false : trial.force_correct_button_press;
    //trial.prompt = (typeof trial.prompt === 'undefined') ? '' : trial.prompt;
    //trial.show_feedback_on_timeout = (typeof trial.show_feedback_on_timeout === 'undefined') ? false : trial.show_feedback_on_timeout;
    //trial.timeout_message = trial.timeout_message || "<p>Please respond faster.</p>";
    // timing params
    //trial.response_ends_trial = (typeof trial.response_ends_trial == 'undefined') ? false : trial.response_ends_trial;
    //trial.timing_stim = trial.timing_stim || -1; // default is to show image until response
    //trial.timing_response = trial.timing_response || -1; // default is no max response time
    //trial.timing_feedback_duration = trial.timing_feedback_duration || 2000;
    //trial.timing_post_trial = (typeof trial.timing_post_trial === 'undefined') ? 1000 : trial.timing_post_trial;

	//adding this option to allow situations with feedback only shown on trial timeout
	//trial.only_timeout_feedback = (typeof trial.only_timeout_feedback === 'undefined') ? false: trial.only_timeout_feedback;
	
    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    //trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    // this array holds handlers from setTimeout calls
    // that need to be cleared if the trial ends early
    var setTimeoutHandlers = [];

    if (!trial.is_html) {
      // add image to display
	  var tmpstim = ($('<img>', {
        "src": trial.stimulus,
        "class": 'jspsych-poldrack-categorize-stimulus',
        "id": 'jspsych-poldrack-categorize-stimulus'
      }));
      display_element.append(tmpstim[0]);
    } else {
		var tmpstim = ($('<div>', {
        "id": 'jspsych-poldrack-categorize-stimulus',
        "class": 'jspsych-poldrack-categorize-stimulus',
        "html": trial.stimulus
      }));
      display_element.append(tmpstim[0]);
    }

    // hide image after time if the timing parameter is set
    if (trial.timing_stim > 0) {
      setTimeoutHandlers.push(setTimeout(function() {
        $('#jspsych-poldrack-categorize-stimulus').css('visibility', 'hidden');
      }, trial.timing_stim));
    }

    // if prompt is set, show prompt
    if (trial.prompt !== "") {
		var tmpstim = ($('<div>',{"html": trial.prompt}));
		display_element.append(tmpstim[0]);
    }


	var audio = new Audio();
	if (trial.incorrect_audio != null) {
		audio.src = trial.incorrect_audio;
		audio.loop = false;
		jsPsych.pluginAPI.preloadAudio(audio.src);
	}
	trial.audio = audio;
	
	function errorDing() {
		trial.audio.play();
	}
	
	
    var trial_data = {};

    // create response function
    var after_response = function(info) {

      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      $("#jspsych-poldrack-categorize-stimulus").addClass('responded');

      // kill any remaining setTimeout handlers
      for (var i = 0; i < setTimeoutHandlers.length; i++) {
        clearTimeout(setTimeoutHandlers[i]);
      }

      // clear keyboard listener
      jsPsych.pluginAPI.cancelAllKeyboardResponses();
      var correct = false;
	  correct = jsPsych.pluginAPI.compareKeys(trial.key_answer, info.key);
      //if (trial.key_answer == info.key) {
      //  correct = true;
      //}

      //calculate stim and block duration
      var stim_duration = trial.timing_stim
      var block_duration = trial.timing_response
      if (trial.response_ends_trial & info.rt != -1) {
          block_duration = info.rt
      }
      if (stim_duration != -1) {
        stim_duration = Math.min(block_duration,trial.timing_stim)
      } else {
        stim_duration = block_duration
      }

      // save data
      trial_data = {
        "rt": info.rt,
        "correct": correct,
        "stimulus": trial.stimulus,
        "key_press": info.key,
        "correct_response": trial.key_answer,
        "possible_responses": trial.choices,
        "stim_duration": stim_duration,
        "block_duration": block_duration,
        "feedback_duration": trial.timing_feedback_duration,
        "timing_post_trial": trial.timing_post_trial
      };


      var timeout = info.rt == -1;

      // if response ends trial display feedback immediately
      if (trial.response_ends_trial || info.rt == -1) {
        display_element.innerHTML = '';
        doFeedback(correct, timeout);
      // otherwise wait until timing_response is reached
      } else {
        if (trial.timing_stim > -1) {
          setTimeout(function() {
            $('#jspsych-poldrack-categorize-stimulus').css('visibility', 'hidden');
          }, trial.timing_stim - info.rt);
          setTimeout(function() {
            doFeedback(correct, timeout);
          }, trial.timing_response - info.rt);
        }
        else {
          setTimeout(function() {
            display_element.innerHTML = '';
            doFeedback(correct, timeout);
          }, trial.timing_response - info.rt);
        }
      }
    }

    jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_response,
      valid_responses: trial.choices,
      rt_method: 'performance',
      persist: false,
      allow_held_key: false
    });

    if (trial.timing_response > 0) {
      setTimeoutHandlers.push(setTimeout(function() {
        after_response({
          key: -1,
          rt: -1
        });
      }, trial.timing_response));
    }
	
    function doFeedback(correct, timeout) {

      if (timeout && !trial.show_feedback_on_timeout) {
        display_element.innerHTML += trial.timeout_message;
      } else {
        // show image during feedback if flag is set
        if (trial.show_stim_with_feedback) {
          if (!trial.is_html) {
            // add image to display
            display_element.innerHTML += ($('<img>', {
              "src": trial.stimulus,
              "class": 'jspsych-poldrack-categorize-stimulus',
              "id": 'jspsych-poldrack-categorize-stimulus'
            }));
          } else {
            display_element.innerHTML += ($('<div>', {
              "id": 'jspsych-poldrack-categorize-stimulus',
              "class": 'jspsych-poldrack-categorize-stimulus',
              "html": trial.stimulus
            }));
          }
        }

        // substitute answer in feedback string.
        var atext = "";
        if (correct) {
          atext = trial.correct_text.replace("%ANS%", trial.text_answer);
        } else {
          atext = trial.incorrect_text.replace("%ANS%", trial.text_answer);
        }

        // show the feedback
        display_element.innerHTML += atext;
		if (!correct & !timeout & trial.incorrect_audio != null) {
			errorDing();
		}
      }
      // check if force correct button press is set
      if (trial.force_correct_button_press && correct === false && ((timeout && trial.show_feedback_on_timeout) || !timeout)) {

        var after_forced_response = function(info) {
          endTrial();
        }

        jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_forced_response,
          valid_responses: [trial.key_answer],
          rt_method: 'date',
          persist: false,
          allow_held_key: false
        });

      } else {
		if (trial.only_timeout_feedback && (correct || !timeout)) {
			trial.timing_feedback_duration=0;
		}
        setTimeout(function() {
          endTrial();
        }, trial.timing_feedback_duration);
      }

    }

    function endTrial() {
      display_element.innerHTML = '';
      jsPsych.finishTrial(trial_data);
    }

  };

  return plugin;
})();
