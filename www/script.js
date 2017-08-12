var table;
var buttons = {};
var hass_active = false;
var hass_a_active = false;
var hass_h_active = false;
var hass_s_active = false;
var ci_h_active = false;
var ci_hw_active = false;
var conflicts_active = false;
var no_ci_active = false;
var rest_active = false;
var lab_active = false;
var final_active = false;
var under_active = false;
var grad_active = false;
var cur_class;
var cur_classes = [];
var options;
var cur_option = 0;
var cur_min_conflicts = 0;
var all_sections;
var calc_classes = [];
var calc_slots = [];
var conflicts_flag;
var activities = [];
var locked_slots = {};
var gcal_slots = [];

var colors = ["#16A085", "#2980B9", "#9B59B6", "#C0392B", "#D35400", "#7F8C8D", "#27AE60"];
var colors_dark = ["#36C0A5", "#49A0D9", "#BB79D6", "#E0594B", "#F37420", "#9FACAD", "#47CE80"];

Number.prototype.format = function (n, x) {
	var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
	return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

String.prototype.paddingLeft = function (paddingValue) {
	return String(paddingValue + this).slice(-paddingValue.length);
};

String.prototype.paddingRight = function (paddingValue) {
	return String(this + paddingValue).slice(0, paddingValue.length);
};

function id_sanitize(str) {
	return str.replace(/\W/g, '');
}

function escapeRegExp(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function class_sort_internal(a, b) {
	var mult;
	var len;

	if (a.length < b.length) {
		return -1
	} else if (a.length > b.length) {
		return 1;
	}

	for (var i = 0; i < a.length; i++) {
		if (a.charAt(i) < b.charAt(i)) {
			return -1;
		}
		else if (a.charAt(i) > b.charAt(i)) {
			return 1;
		}
	}

	return 0;
}

function class_sort_internal2(a, b) {
	var mult;
	var len;

	if (a.length < b.length) {
		mult = -1;
		len = a.length;
	} else if (a.length > b.length) {
		mult = 1;
		len = b.length;
	} else {
		mult = 0;
		len = a.length;
	}

	for (i = 0; i < len; i++) {
		if (a.charAt(i) < b.charAt(i)) {
			return -1;
		}
		else if (a.charAt(i) > b.charAt(i)) {
			return 1;
		}
	}

	return mult;
}

function class_sort(a, b) {
	var a_s = a.split('.');
	var b_s = b.split('.');

	var sort = class_sort_internal(a_s[0], b_s[0]);

	if (sort === 0) {
		sort = class_sort_internal2(a_s[1], b_s[1]);
	}

	return sort;
}

jQuery.extend(jQuery.fn.dataTableExt.oSort, {
	"class-asc": function (a, b) {
		return class_sort(a, b);
	},
	"class-desc": function (a, b) {
		return class_sort(a, b) * -1;
	}
});

function search_setup() {
	$('#class-input').on('keyup', function () {
		if (table.column(0).search() !== this.value) {
			table.column(0)
				.search("^" + escapeRegExp(this.value), true, false, true)
				.draw();
		}
	});
}

function expand_type(type) {
	if (type == 'l') {
		return 'lec';
	} else if (type == 'r') {
		return 'rec';
	} else if (type == 'b') {
		return 'lab';
	} else {
		return '';
	}
}

function add_cal(number, type, room, slot, length) {
	var day = Math.floor(slot / 30) + 1;
	var hour = (Math.floor((slot % 30) / 2) + 8).toString().paddingLeft("00");
	var minute = ((slot % 2) * 30).toString().paddingLeft("00");

	var end_hour = (Math.floor(((slot + length) % 30) / 2) + 8).toString().paddingLeft("00");
	var end_minute = (((slot + length) % 2) * 30).toString().paddingLeft("00");

	var type_full = expand_type(type);

	gcal_slots.push([day - 1, hour + ':' + minute, end_hour + ':' + end_minute,
					 number + ' ' + type_full, room]);

	var index = cur_classes.indexOf(number);
	var color = colors[index % colors.length];
	var color_dark = colors_dark[index % colors_dark.length];

	var event = {
		title: number + ' ' + type_full + '\n' + room,
		start: '2016-08-0' + day + 'T' + hour + ':' + minute,
		end: '2016-08-0' + day + 'T' + end_hour + ':' + end_minute,
		backgroundColor: color,
		borderColor: color_dark
	};

	$("#calendar").fullCalendar('renderEvent', event, true);

	var n_number = id_sanitize(number);
	$("#" + n_number + "-button").css({
		"background-color": color,
		"border-color": color,
		"color": "#ffffff"
	});
}

function conflict_check(slot1, slot2) {
	return ((slot1[0] < slot2[0] + slot2[1]) &&
			(slot2[0] < slot1[0] + slot1[1]))
}

function select_helper(all_sections, chosen_slots, chosen_options, cur_conflicts, min_conflicts) {
	var chosen = [];

	if (all_sections.length == 0) {
		return [[chosen_options], cur_conflicts]
	}

	var slot;
	var new_conflicts;
	var out;

	var new_all_sections = all_sections.slice()
	new_all_sections.shift();  // Yes, this has to be separate.

	var section = all_sections[0];
	var slots = classes[section[0]][section[1]];

	for (var s = 0; s < slots.length; s++) {
		slot = slots[s][0];
		new_conflicts = 0;

		for (var cs = 0; cs < chosen_slots.length; cs++) {
			for (var ss = 0; ss < slot.length; ss++) {
				if (conflict_check(slot[ss], chosen_slots[cs])) {
					new_conflicts++;
				}
			}
		}

		if (cur_conflicts + new_conflicts > min_conflicts) {
			continue;
		}

		out = select_helper(new_all_sections,
							chosen_slots.concat(slot),
							chosen_options.concat(s),
							cur_conflicts + new_conflicts,
							min_conflicts);

		if (out[1] < min_conflicts) {
			chosen = [];
			min_conflicts = out[1];
		}

		if (out[1] == min_conflicts) {
			chosen = chosen.concat(out[0]);
		}
	}

	return [chosen, min_conflicts]
}


function select_slots() {
	var all_class_sections = [];
	for (var c = 0; c < cur_classes.length; c++) {
		for (var s = 0; s < classes[cur_classes[c]]['s'].length; s++) {
			all_class_sections.push([classes[cur_classes[c]]['no'],
							   classes[cur_classes[c]]['s'][s]])
		}
	}

	all_class_sections.sort(function (a, b) {
		return (classes[a[0]][a[1]].length -
				classes[b[0]][b[1]].length);
	});

	all_sections = [];
	var tmp_options = [];
	var init_slots = [];
	var auto_sections = [];
	for (var i = 0; i < all_class_sections.length; i++) {
		var section = all_class_sections[i]
		if (section in locked_slots) {
			if (locked_slots[section] != "none") {
				all_sections.push(section);
				tmp_options.push(locked_slots[section]);
				init_slots = init_slots.concat(classes[section[0]][section[1]][locked_slots[section]][0]);
			}
		} else {
			auto_sections.push(section);
		}
	}
	all_sections = all_sections.concat(auto_sections);

	var tmp = select_helper(auto_sections, init_slots, [], 0, 1000);
	for (var o = 0; o < tmp[0].length; o++) {
		tmp[0][o] = tmp_options.concat(tmp[0][o]);
	}
	options = tmp[0];
	cur_min_conflicts = tmp[1];

	set_option(0);
	$("#cal-options-2").text(options.length);

	if (options.length >= 15) {
		$("#warning3-div").show();
		$("#buttons-div").css("margin", "10 auto");
	} else {
		$("#warning3-div").hide();
		$("#buttons-div").css("margin", "20 auto");
	}

	var n_number;
	var units = 0;
	var hours = 0;
	var flag = false;
	var flag2 = false;
	var toappend;
	for (var c = 0; c < cur_classes.length; c++) {
		toappend = '';
		n_number = id_sanitize(cur_classes[c]);
		units += classes[cur_classes[c]]['u1'] + classes[cur_classes[c]]['u2'] + classes[cur_classes[c]]['u3'];
		hours += classes[cur_classes[c]]['h'];

		if (classes[cur_classes[c]]['h'] === 0 && classes[cur_classes[c]]['s'][0] != 'a') {
			toappend += '*';
			flag = true;
		}

		if (classes[cur_classes[c]]['tb']) {
			toappend += '+';
			flag2 = true;
		}

		$('#' + n_number + '-button').text(cur_classes[c] + toappend);
	}

	$("#total-units").text(units);
	$("#total-hours").text(hours.format(1));

	if (flag) {
		$("#total-hours").append("*");
		$("#warning-div").show();
	} else {
		$("#warning-div").hide();
	}

	if (flag2) {
		$("#warning2-div").show();
	} else {
		$("#warning2-div").hide();
	}

	Cookies.set('cur_classes', cur_classes, { expires: 365 });
}

function set_option(index) {
	var option = options[index];
	var slots;

	$("#calendar").fullCalendar('removeEvents');

	gcal_slots = [];

	for (var o = 0; o < option.length; o++) {
		var number = all_sections[o][0];
		var type = all_sections[o][1];
		slots = classes[number][type][option[o]];
		var room = slots[1];
		for (var s = 0; s < slots[0].length; s++) {
			add_cal(number, type, room,
					slots[0][s][0], slots[0][s][1]);
		}
	}

	cur_option = index;
	$("#cal-options-1").text(cur_option + 1);

	Cookies.set('cur_option', cur_option, { expires: 365 });
}

function conflict_helper(new_sections, old_slots) {
	var section;
	var slots;

	section_loop: for (var n = 0; n < new_sections.length; n++) {
		section = new_sections[n];
		slots = classes[section[0]][section[1]];

		slot_loop: for (var s = 0; s < slots.length; s++) {
			slot = slots[s][0];

			for (var os = 0; os < old_slots.length; os++) {
				for (var ss = 0; ss < slot.length; ss++) {
					if (conflict_check(slot[ss], old_slots[os])) {
						continue slot_loop;
					}
				}
			}

			continue section_loop;
		}

		return false;
	}

	return true;
}

function is_selected(number) {
	var selected = false;

	if (hass_active || hass_a_active || hass_h_active || hass_s_active) {
		if (hass_active || hass_a_active) {
			if (classes[number]['ha']) {
				selected = true;
			}
		}

		if (hass_active || hass_h_active) {
			if (classes[number]['hh']) {
				selected = true;
			}
		}

		if (hass_active || hass_s_active) {
			if (classes[number]['hs']) {
				selected = true;
			}
		}

		if (hass_active) {
			if (classes[number]['he']) {
				selected = true;
			}
		}

		if (!selected) {
			return false;
		}
	}

	selected = false;

	if (ci_h_active || ci_hw_active) {
		if (ci_h_active) {
			if (classes[number]['ci']) {
				selected = true;
			}
		}

		if (ci_hw_active) {
			if (classes[number]['cw']) {
				selected = true;
			}
		}

		if (!selected) {
			return false;
		}
	}

	if (no_ci_active) {
		if (classes[number]['ci'] || classes[number]['cw']) {
			return false;
		}
	}

	if (rest_active) {
		if (!classes[number]['re']) {
			return false;
		}
	}

	if (lab_active) {
		if (!(classes[number]['la'] || classes[number]['pl'])) {
			return false;
		}
	}

	if (final_active) {
		if (classes[number]['f']) {
			return false;
		}
	}

	if (under_active || grad_active) {
		selected = false;

		if (under_active) {
			if (classes[number]['le'] == 'U') {
				selected = true;
			}
		}

		if (grad_active) {
			if (classes[number]['le'] == 'G') {
				selected = true;
			}
		}

		if (!selected) {
			return false;
		}
	}

	selected = false;

	if (conflicts_active) {
		if (!conflicts_flag) {
			var option;
			var section;
			var slots;
			var slot;

			calc_classes = cur_classes.slice();
			calc_slots = [];

			for (var op = 0; op < options.length; op++) {
				option = options[op];
				slots = [];

				for (var o = 0; o < option.length; o++) {
					slots.push.apply(slots, classes[all_sections[o][0]][all_sections[o][1]][option[o]][0]);
				}

				calc_slots.push(slots);
			}

			conflicts_flag = true;
		}

		if (cur_classes.length == 0) {
			return true;
		}

		var class_slots = [];

		for (var s = 0; s < classes[number]['s'].length; s++) {
			class_slots.push([classes[number]['no'],
			classes[number]['s'][s]]);
		}

		if (class_slots.length == 0) {
			return false;
		}

		for (var c = 0; c < calc_slots.length; c++) {
			if (conflict_helper(class_slots, calc_slots[c])) {
				return true;
			}
		}

		return false;
	}

	return true;
}

function fill_table() {
	table.clear();

	conflicts_flag = false;

	for (var c in classes) {
		if (is_selected(c)) {
			table.rows.add([[classes[c]['no'],
			classes[c]['ra'].format(1),
			classes[c]['h'].format(1),
			classes[c]['n']]]);
		}
	}

	table.draw();

	$('#apply').blur();
}

function link_classes(text, type) {
	var to_append;
	var lp;
	var n_number;
	var split = text.split(" ");

	for (var p in split) {
		lp = split[p];
		to_append = '';

		if (lp.indexOf(',') != -1) {
			to_append += ',';
			lp = lp.replace(',', '');
		}

		if (lp.indexOf(';') != -1) {
			to_append += ';'
			lp = lp.replace(';', '');
		}


		if (lp in classes) {
			n_number = id_sanitize(lp);
			$('#class-' + type).append('<span class="link-span" id="' + type + '-' + n_number + '">' + lp + '</span>' + to_append + ' ');

			(function () {
				var tmp_str = lp;
				$('#' + type + '-' + n_number).click(function () {
					class_desc(tmp_str);
				});
			})();
		} else {
			$('#class-' + type).append(lp + to_append + ' ');
		}
	}
}

function class_desc(number) {
	$('#class-name').text(classes[number]['no'] + ': ' + classes[number]['n']);
	$('.type-span').hide();

	if (classes[number]['nx']) {
		$('#nonext-span').show();
	}

	if (classes[number]['le'] == 'U') {
		$('#under-span').show();
	}
	else if (classes[number]['le'] == 'G') {
		$('#grad-span').show();
	}

	if (classes[number]['t'].indexOf('FA') != - 1) {
		$('#fall-span').show();
	}
	if (classes[number]['t'].indexOf('JA') != - 1) {
		$('#iap-span').show();
	}
	if (classes[number]['t'].indexOf('SP') != - 1) {
		$('#spring-span').show();
	}
	if (classes[number]['t'].indexOf('SU') != - 1) {
		$('#summer-span').show();
	}

	$('#end-paren-span').show();

	if (classes[number]['rp']) {
		$('#repeat-span').show();
	}

	if (classes[number]['re']) {
		$('#rest-span').show();
	}

	if (classes[number]['la']) {
		$('#Lab-span').show();
	}

	if (classes[number]['pl']) {
		$('#PartLab-span').show();
	}

	if (classes[number]['hh']) {
		$('#hassH-span').show();
	}

	if (classes[number]['ha']) {
		$('#hassA-span').show();
	}

	if (classes[number]['hs']) {
		$('#hassS-span').show();
	}

	if (classes[number]['he']) {
		$('#hassE-span').show();
	}

	if (classes[number]['ci']) {
		$('#cih1-span').show();
	}

	if (classes[number]['cw']) {
		$('#cihw-span').show();
	}

	var u1 = classes[number]['u1'];
	var u2 = classes[number]['u2'];
	var u3 = classes[number]['u3'];

	if (classes[number]['f']) {
		$('#final-span').show();
	}

	$('#class-prereq').html('Prereq: ');
	link_classes(classes[number]['pr'], 'prereq');

	try {
		$('#class-same').html('<br>Same class as ');
		if (classes[number]['sa'] != '') {
			link_classes(classes[number]['sa'], 'same');
			$('#class-same').show();
		} else {
			$('#class-same').hide();
		}

		$('#class-meets').html('<br>Meets with ');
		if (classes[number]['mw'] != '') {
			link_classes(classes[number]['mw'], 'meets');
			$('#class-meets').show();
		} else {
			$('#class-meets').hide();
		}
	} catch (err) {
		$('#class-same').hide();
		$('#class-meets').hide();
	}

	$('#class-units').text((u1 + u2 + u3) + ' units: ' + u1 + '-' + u2 + '-' + u3);

	$('#class-rating').text((classes[number]['ra']).format(1));
	$('#class-hours').text((classes[number]['h']).format(1));
	$('#class-people').text((classes[number]['si']).format(1));
	$('#class-eval').show();

	$('#class-desc').html(classes[number]['d'] + '<br><br>');

	if (classes[number]['u'] != '') {
		$('#class-desc').append('<a href="' + classes[number]['u'] + '" target="_blank">More info</a> | ');
	}

	$('#class-desc').append('<a href="http://student.mit.edu/catalog/search.cgi?search=' + number +
		'" target="_blank">Course Catalog</a> | <a href="https://sisapp.mit.edu/ose-rpt/subjectEvaluationSearch.htm?search=Search&subjectCode=' +
		number + '" target="_blank">Class Evaluations</a>');

	cur_class = number;

	n_number = id_sanitize(number);

	if (cur_classes.indexOf(number) == -1) {
		$('#class-buttons-div').html('<button type="button" class="btn btn-primary" id=' + n_number + '-add-button>Add class</button>');

		$('#' + n_number + '-add-button').click(function () {
			add_class(number);
		});

		$("#manual-button").hide();
		$("#manual-div").hide();
	} else {
		$('#class-buttons-div').html('<button type="button" class="btn btn-primary" id=' + n_number + '-remove-button>Remove class</button>');

		$('#' + n_number + '-remove-button').click(function () {
			remove_class(number);
		});

		$("#manual-button").text("+ Manually set sections");
		$("#manual-button").show();
		$("#manual-div").hide();
	}

	if (classes[number]['s'].indexOf('a') != -1) {
		$('#flags-div').hide();
		$('#class-name').text(classes[number]['no']);
	} else {
		$('#flags-div').show();
	}
}

function add_class(number) {
	var n_number = id_sanitize(number);

	$('#selected-div').append('<button type="button" class="btn btn-primary" id=' + n_number + '-button>' + number + '</button>');

	$('#' + n_number + '-button').click(function () {
		class_desc(number);
	});

	$('#' + n_number + '-button').dblclick(function () {
		remove_class(number);
	});

	cur_classes.push(number);
	try { class_desc(number); }
	catch (err) { }
	select_slots();
	$("#units-div").show();
}

function remove_class(number) {
	var n_number = id_sanitize(number);

	$('#' + n_number + '-button').remove();

	cur_classes.splice(cur_classes.indexOf(number), 1);
	class_desc(number);
	if (cur_classes.length == 0) {
		options = [[]];
		cur_option = 0;
		$("#cal-options-1").text('1');
		$("#cal-options-2").text('1');
		$("#calendar").fullCalendar('removeEvents');
		$("#units-div").hide();
		$("#warning-div").hide();
		$("#warning2-div").hide();
		Cookies.set('cur_classes', cur_classes, { expires: 365 });
		Cookies.set('cur_option', cur_option, { expires: 365 });
	} else {
		select_slots();
	}
}

function add_activity() {
	var days = [$("#act-mon").is(":checked"), $("#act-tue").is(":checked"),
	$("#act-wed").is(":checked"), $("#act-thu").is(":checked"),
	$("#act-fri").is(":checked")];
	var name = $("#activity-input").val();
	var start_time = $("#start-time").timepicker('getSecondsFromMidnight') / 1800 - 16;
	var end_time = $("#end-time").timepicker('getSecondsFromMidnight') / 1800 - 16;

	if (start_time >= end_time) {
		return;
	}

	var slots = [];

	for (var i = 0; i < 5; i++) {
		if (days[i]) {
			slots.push([i * 30 + start_time, end_time - start_time]);
		}
	}

	set_activity(name, slots);
	if (cur_classes.indexOf(name) == -1) {
		add_class(name);
	} else {
		select_slots();
	}
}

function set_activity(name, slots) {
	var activity = {
		'no': name,
		'co': '',
		'cl': '',
		'f': false,
		'tb': false,
		's': ['a'],
		'a': [[slots, '']],
		'hh': false,
		'ha': false,
		'hs': false,
		'he': false,
		'ci': false,
		'cw': false,
		'rp': false,
		're': false,
		'la': false,
		'pl': false,
		'u1': 0,
		'u2': 0,
		'u3': 0,
		'le': 'U',
		't': ['FA'],
		'sa': '',
		'mw': '',
		'u': '',
		'pr': 'None',
		'd': 'Your activity!',
		'n': name,
		'ra': 0,
		'h': 0,
		'si': 0
	};

	activities.push(activity);
	classes[name] = activity;

	Cookies.set('activities', activities, { expires: 365 });
}

function calendar_export() {
	if (typeof gapi.auth2 != 'undefined' && gapi.auth2.getAuthInstance().isSignedIn.get()) {
		calendar_send(true);
	} else {
		gapi.client.init({
			'apiKey': "AIzaSyC_ALyKTv8OvcaBXlJU1u3ifJoeQVCY45Q",
			'discoveryDocs': ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
			'clientId': "770500080614-drje51h0h8hlsfra9s4cv93vb9omm220.apps.googleusercontent.com",
			'scope': "https://www.googleapis.com/auth/calendar"
		}).then(function () {
			return gapi.auth2.getAuthInstance().signIn();
		}).then(function () {
			calendar_send(gapi.auth2.getAuthInstance().isSignedIn.get());
		});
	}
}

function calendar_send(isSignedIn) {
	if (isSignedIn) {
		$("#calendar-link").text("Working...");

		gapi.client.calendar.calendarList.list({}).then(function (resp) {
			var name = "Firehose: Fall 2017";
			var ids = [];

			for (var i in resp.result.items) {
				if (resp.result.items[i].summary == name) {
					ids.push(resp.result.items[i].id);
				}
			}

			for (var i in ids) {
				gapi.client.calendar.calendars.delete({
					'calendarId': ids[i]
				}).then();
			}

			return gapi.client.calendar.calendars.insert({
				'summary': name
			});
		}).then(function (resp) {
			var id = resp.result.id;

			gapi.client.calendar.calendarList.get({
				'calendarId': id
			}).then(function (resp) {
				var cal_list = resp.result;
				resp.result.backgroundColor = "#DB5E45"

				gapi.client.calendar.calendarList.update({
					'calendarId': resp.result.id,
					'colorRgbFormat': true,
					'resource': cal_list
				}).then();
			});

			var start_dates = ['2017-09-11', '2017-09-12', '2017-09-06', '2017-09-07', '2017-09-08'];
			var end_dates = ['20171218', '20171219', '20171220', '20171214', '20171215'];
			var ex_dates = [['20171009'], ['20171010'], ['20170101'], ['20171123'],
			['20170929', '20171110', '20171124']];
			var batch = gapi.client.newBatch();

			for (var s in gcal_slots) {
				var g = gcal_slots[s];

				var ex_date = '';
				var time = 'T' + g[1].replace(':', '') + '00,';

				for (var x in ex_dates[g[0]]) {
					ex_date += ex_dates[g[0]][x] + time;
				}

				batch.add(gapi.client.calendar.events.insert({
					'calendarId': id,
					'resource': {
						'summary': g[3],
						'location': g[4],
						'start': {
							'dateTime': start_dates[g[0]] + 'T' + g[1] + ':00',
							'timeZone': "America/New_York"
						},
						'end': {
							'dateTime': start_dates[g[0]] + 'T' + g[2] + ':00',
							'timeZone': "America/New_York"
						},
						'recurrence': [
							'RRULE:FREQ=WEEKLY;UNTIL=' + end_dates[g[0]],
							'EXDATE;TZID=America/New_York:' + ex_date
						]
					}
				}));
			}

			return batch;
		}).then(function (resp) {
			window.open('https://calendar.google.com', '_blank');
			$("#calendar-link").text("Export to Google Calendar");
		});
	}
}

function clipboard_export() {
	var class_strs = [];
	var option = options[cur_option];
			
	for (var o = 0; o < option.length; o++) {
		var number = all_sections[o][0];
		var type = all_sections[o][1];
		if (type != 'a') {
			slots = classes[number][type][option[o]];
			var room = slots[1];
			var csb_slot = classes[number][type + 'r'][option[o]]
			class_strs.push([number, (number + ' ' + expand_type(type)).paddingRight('             ') + room.paddingRight('         ') + csb_slot]); 			
		}
	}

	class_strs.sort(function(a, b) {
		return class_sort(a[0], b[0]);
	});

	var class_str = [];
	for (var i = 0; i < class_strs.length; i++) {
		class_str.push(class_strs[i][1])
	}

	$("#modal-textarea").prop("rows", option.length);
	$('#modal-textarea').val(class_str.join('\r\n'));
	$('#modal').modal('show');
}

$(document).ready(function () {
	$('#calendar').fullCalendar({
		allDaySlot: false,
		columnFormat: 'dddd',
		defaultDate: '2016-08-01',
		defaultView: 'agendaWeek',
		editable: false,
		header: false,
		height: "auto",
		minTime: "08:00:00",
		maxTime: "22:00:00",
		weekends: false,
		eventClick: function (calEvent, jsEvent, view) {
			var name = calEvent.title.split(' ')[0];
			class_desc(name);
		}
	});

	table = $("#eval-table").DataTable({
		iDisplayLength: 3000,
		sDom: "t",
		deferRender: true,
		order: [[0, "asc"]],
		columnDefs: [
			{
				targets: [0],
				type: "class",
				render: function (data, type, row, meta) {
					if (type === 'display') {
						data = '<a href="#">' + data + '</a>';
					}

					return data;
				}
			},
			{
				targets: [3],
				orderable: false
			}
		],
		scrollY: "30vh",
		scroller: true
	});

	fill_table();
	search_setup();

	$("#eval-loading").hide();
	$("#eval-table-div").show();

	table.columns.adjust().draw();

	$("#class-input").on("keypress", function (e) {
		if (e.keyCode == 13) {
			var c = $('#class-input').val().toUpperCase();
			if (classes.hasOwnProperty(c)) {
				if (cur_classes.indexOf(c) == -1) {
					add_class(c);
				} else {
					remove_class(c);
				}
				$('#class-input').val('');
			}
		}
	});

	$('#eval-table tbody').on('click', 'tr', function () {
		var tr = $(this).closest('tr');
		var row = table.row(tr);

		class_desc(row.data()[0]);
	});

	$('#eval-table tbody').on('dblclick', 'tr', function () {
		var tr = $(this).closest('tr');
		var row = table.row(tr);
		var c = row.data()[0];

		if (cur_classes.indexOf(c) == -1) {
			add_class(c);
		} else {
			remove_class(c);
		}
	});

	$("#cal-left").click(function () {
		set_option((cur_option + options.length - 1) % options.length);
		$("#cal-left").blur();
	});

	$("#cal-right").click(function () {
		set_option((cur_option + options.length + 1) % options.length);
		$("#cal-right").blur();
	});

	$("#activity-button").click(function () {
		if ($("#activity-div").is(":visible")) {
			$("#activity-div").hide();
			$("#activity-button").text("+ Add non-class activity");
		} else {
			$("#activity-div").show();
			$("#activity-button").text("- Hide non-class activity pane");
		}
	});

	$("#start-time").timepicker({
		'forceRoundTime': true,
		'disableTextInput': true,
		'minTime': '08:00am',
		'maxTime': '09:30pm'
	});
	$("#end-time").timepicker({
		'forceRoundTime': true,
		'disableTextInput': true,
		'minTime': '08:30am',
		'maxTime': '10:00pm'
	});

	$("#add-activity-button").click(function () {
		add_activity();
	});

	$("#activity-input").on("keypress", function (e) {
		if (e.keyCode == 13) {
			add_activity();
		}
	});

	$(".act-day").click(function () {
		var days = [$("#act-mon").is(":checked"), $("#act-tue").is(":checked"),
		$("#act-wed").is(":checked"), $("#act-thu").is(":checked"),
		$("#act-fri").is(":checked")];

		for (var i = 0; i < 5; i++) {
			if (days[i]) {
				$('#add-activity-button').prop('disabled', false);
				return;
			}
		}

		$('#add-activity-button').prop('disabled', true);
	});

	$(".selector-button").click(function () {
		window[this.id + '_active'] = !window[this.id + '_active']
		fill_table();
	});

	$(function () {
  		$('[data-toggle="tooltip"]').tooltip()
	});

	$(".lazyload-img").each(function () {
		$(this).attr('src', $(this).attr('data-src'));
	});

	$("#expand-button").click(function () {
		if ($("#adv-buttons-div").is(":visible")) {
			$("#adv-buttons-div").hide();
			$("#expand-button").text("+ More filters");
		} else {
			$("#adv-buttons-div").show();
			$("#expand-button").text("- Fewer filters");
		}
	});

	$("#prereg-link").click(function () {
		window.open("https://student.mit.edu/cgi-bin/sfprwtrm.sh?" + cur_classes.join(','), "_blank");
	});

	$("#calendar-link").click(function () {
		calendar_export();
	});

	$("#clipboard-link").click(function () {
		$('#clipboard-button').tooltip('hide');
		clipboard_export();
	});

	$("#clipboard-button").click(function () {
		$("#modal-textarea").select();
		if (document.execCommand('copy')) {
			$('#clipboard-button').tooltip('show');
			setTimeout(function() {
				$('#clipboard-button').tooltip('hide');
			}, 1000);
		}
		$("#modal-textarea").prop("selected", false);
	});

	$("#manual-button").click(function () {
		if ($("#manual-div").is(":visible")) {
			$("#manual-div").hide();
			$("#manual-button").text("+ Manually set sections");
		} else {
			var slot = [cur_class, 'l'];

			if (classes[cur_class]['s'].indexOf('l') != -1) {
				$("#spec-man-lec-div").html('');

				for (var l in classes[cur_class]['lr']) {
					$("#spec-man-lec-div").append('<input type="radio" class="man-button" id="lec-' + l + '" name="lec" value="' + l +
						'"> ' + classes[cur_class]['lr'][l] + '<br>');

					(function () {
						var tmp = l;
						var stmp = slot;
						$("#lec-" + tmp).click(function () {
							locked_slots[stmp] = tmp;
							Cookies.set('locked_slots', locked_slots, { expires: 365 });
							select_slots();
						});
					})();
				}

				$("#man-lec-div").show();
			} else {
				$("#man-lec-div").hide();
			}

			if (slot in locked_slots) {
				$("#lec-" + locked_slots[slot]).prop("checked", true);
			} else {
				$("#lec-auto").prop("checked", true);
			}

			slot = [cur_class, 'r'];

			if (classes[cur_class]['s'].indexOf('r') != -1) {
				$("#spec-man-rec-div").html('');
				for (var r in classes[cur_class]['rr']) {
					$("#spec-man-rec-div").append('<input type="radio" class="man-rec-button" id="rec-' + r + '" name="rec" value="' + r +
						'"> ' + classes[cur_class]['rr'][r] + '<br>');

					(function () {
						var tmp = r;
						var stmp = slot;
						$("#rec-" + tmp).click(function () {
							locked_slots[stmp] = tmp;
							Cookies.set('locked_slots', locked_slots, { expires: 365 });
							select_slots();
						});
					})();
				}

				$("#man-rec-div").show();
			} else {
				$("#man-rec-div").hide();
			}

			if (slot in locked_slots) {
				$("#rec-" + locked_slots[slot]).prop("checked", true);
			} else {
				$("#rec-auto").prop("checked", true);
			}

			slot = [cur_class, 'b'];

			if (classes[cur_class]['s'].indexOf('b') != -1) {
				$("#spec-man-lab-div").html('');
				for (var b in classes[cur_class]['br']) {
					$("#spec-man-lab-div").append('<input type="radio" class="man-button" id="lab-' + b + '" name="lab" value="' + b +
						'"> ' + classes[cur_class]['br'][b] + '<br>');

					(function () {
						var tmp = b;
						var stmp = slot;
						$("#lab-" + tmp).click(function () {
							locked_slots[stmp] = tmp;
							Cookies.set('locked_slots', locked_slots, { expires: 365 });
							select_slots();
						});
					})();
				}
				$("#man-lab-div").show();
			} else {
				$("#man-lab-div").hide();
			}

			if (slot in locked_slots) {
				$("#lab-" + locked_slots[slot]).prop("checked", true);
			} else {
				$("#lab-auto").prop("checked", true);
			}

			$("#manual-div").show();
			$("#manual-button").text("- Hide manual selection pane");
		}
	});

	$("#lec-auto").click(function () {
		var slot = [cur_class, 'l'];
		if (slot in locked_slots) {
			delete locked_slots[slot];
		}
		Cookies.set('locked_slots', locked_slots, { expires: 365 });
		select_slots();
	});

	$("#lec-none").click(function () {
		var slot = [cur_class, 'l'];
		locked_slots[slot] = "none";
		Cookies.set('locked_slots', locked_slots, { expires: 365 });
		select_slots();
	});

	$("#rec-auto").click(function () {
		var slot = [cur_class, 'r'];
		if (slot in locked_slots) {
			delete locked_slots[slot];
		}
		Cookies.set('locked_slots', locked_slots, { expires: 365 });
		select_slots();
	});

	$("#rec-none").click(function () {
		var slot = [cur_class, 'r'];
		locked_slots[slot] = "none";
		Cookies.set('locked_slots', locked_slots, { expires: 365 });
		select_slots();
	});

	$("#lab-auto").click(function () {
		var slot = [cur_class, 'b'];
		if (slot in locked_slots) {
			delete locked_slots[slot];
		}
		Cookies.set('locked_slots', locked_slots, { expires: 365 });
		select_slots();
	});

	$("#lab-none").click(function () {
		var slot = [cur_class, 'b'];
		locked_slots[slot] = "none";
		Cookies.set('locked_slots', locked_slots, { expires: 365 });
		select_slots();
	});

	var tmp_cur_classes = Cookies.getJSON('cur_classes');
	var tmp_activities = Cookies.getJSON('activities');
	if (tmp_activities != null) {
		for (var a in tmp_activities) {
			if (tmp_cur_classes != null && tmp_cur_classes.indexOf(tmp_activities[a]['no']) != -1) {
				set_activity(tmp_activities[a]['no'], tmp_activities[a]['a'][0][0])
			}
		}
		Cookies.set('activities', activities, { expires: 365 });
	}

	var tmp_locked_slots = Cookies.getJSON('locked_slots');
	if (tmp_locked_slots != null) {
		for (var l in tmp_locked_slots) {
			if (tmp_locked_slots.hasOwnProperty(l) && tmp_cur_classes.indexOf(l.split(',')[0]) != -1) {
				locked_slots[l] = tmp_locked_slots[l];
			}
		}
		Cookies.set('locked_slots', locked_slots, { expires: 365 });
	}

	var tmp_cur_option = parseInt(Cookies.get('cur_option'));

	if (tmp_cur_classes != null) {
		for (var t in tmp_cur_classes) {
			if (tmp_cur_classes[t] in classes) {
				(function () {
					var number = tmp_cur_classes[t];
					var n_number = id_sanitize(number);

					$('#selected-div').append('<button type="button" class="btn btn-primary" id=' + n_number + '-button>' + number + '</button>');

					$('#' + n_number + '-button').click(function () {
						class_desc(number);
					});

					$('#' + n_number + '-button').dblclick(function () {
						remove_class(number);
					});
				})();

				cur_classes.push(tmp_cur_classes[t]);
			}
		}
		$("#units-div").show();
		select_slots();
		if (tmp_cur_option < options.length) {
			set_option(tmp_cur_option);
		}
	}
});
