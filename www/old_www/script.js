var table;
var terms = {'2015FA': 'Fall 2014',
	    	 '2015JA': 'IAP 2015',
	    	 '2015SP': 'Spring 2015',
	    	 '2015SU': 'Summer 2015',
             '2016FA': 'Fall 2015',
	    	 '2016JA': 'IAP 2016',
	     	 '2016SP': 'Spring 2016',
	     	 '2016SU': 'Summer 2016',
	     	 '2017FA': 'Fall 2016',
	     	 '2017JA': 'IAP 2017',
             '2017SP': 'Spring 2017',
             '2017SU': 'Summer 2017',
			 '2018FA': 'Fall 2017',
			 '2018JA': 'IAP 2018',
             '2018SP': 'Spring 2018',
             '2018SU': 'Summer 2018'}
var buttons = {};
var rs, hs, elig, res;
var prof_search;
var hass_a_active, hass_h_active, hass_s_active, ci_h_active, ci_hw_active, next_active;

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function class_sort_internal(a, b) {
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
	sort = class_sort_internal(a_s[1], b_s[1]);
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
} );

$.fn.dataTable.ext.search.push(
    function( settings, data, dataIndex ) {
	if (!(isNaN(rs))) {
	    if (rs > parseFloat(data[1])) {
		return false;
	    }
	}

	if (!(isNaN(hs))) {
	    if (hs < parseFloat(data[2])) {
		return false;
	    }
	}

	if (!(isNaN(rs))) {
	    if (elig > parseFloat(data[4])) {
		return false;
	    }
	}

	if (!(isNaN(rs))) {
	    if (res > parseFloat(data[5])) {
		return false;
	    }
	}

	return true;
    }
);

function search_setup() {
    $('input', table.column(0).footer()).on( 'keyup change', function () {
        if (table.column(0).search() !== this.value ) {
            table.column(0)
                .search("^" + escapeRegExp(this.value), true, false, true)
                .draw();
            }
    } );

    $('input', table.column(1).footer()).on( 'keyup change', function () {
	rs = parseFloat($('input', table.column(1).footer()).val());
	table.draw();
    } );

    $('input', table.column(2).footer()).on( 'keyup change', function () {
	hs = parseFloat($('input', table.column(2).footer()).val());
	table.draw();
    } );

    $('input', table.column(3).footer()).on( 'keyup change', function () {
        if (table.column(3).search() !== this.value ) {
            table.column(3).search(this.value).draw();
        }
    } );
    
    $('input', table.column(4).footer()).on( 'keyup change', function () {
	elig = parseFloat($('input', table.column(4).footer()).val());
        table.draw();
    } );

    $('input', table.column(5).footer()).on( 'keyup change', function () {
	res = parseFloat($('input', table.column(5).footer()).val());
        table.draw();
    } );

    $('input', table.column(1).footer()).attr('placeholder', '≥  than...');
    $('input', table.column(2).footer()).attr('placeholder', '≤  than...');
    $('input', table.column(4).footer()).attr('placeholder', '≥  than...');
    $('input', table.column(5).footer()).attr('placeholder', '≥  than...');
}

function is_selected(term_data, number) {
    if (!(buttons[term_data.term])) {
	return false;
    }

    /*
    if (next_active) {
	if (!(next_term.hasOwnProperty(number))) {
	    return false;
	}
    }
    */

    var selected = false;

    if (prof_search != '') {
	for (var i = 0; i < term_data.professors.length; i++) {
	    if (term_data.professors[i].name === prof_search) {
		selected = true;
	    }
	}
	if (!selected) {
	    return false;
	}
    }

    selected = false;

    if (hass_a_active || hass_h_active || hass_s_active) {
	if (hass_a_active) {
	    if (hass_a.hasOwnProperty(number)) {
		selected = true;
	    }
	}

	if (hass_h_active) {
	    if (hass_h.hasOwnProperty(number)) {
		selected = true;
	    }
	}

	if (hass_s_active) {
	    if (hass_s.hasOwnProperty(number)) {
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
	    if (ci_h.hasOwnProperty(number)) {
		selected = true;
	    }
	}

	if (ci_hw_active) {
	    if (ci_hw.hasOwnProperty(number)) {
		selected = true;
	    }
	}

	if (!selected) {
	    return false;
	}
    }

    return true;
}

function format_subtable(class_data, number) {
    var subtable =
	'<table class="eval-subtable"><tr>' +
	'<th style="width: 10%">Term</th>' +
	'<th style="width: 5%">Rating</th>' +
	'<th style="width: 10%">Hours (total)</th>' +
	'<th style="width: 25%">Instructor</th>' +
	'<th style="width: 5%">Rating</th>' +
	'<th style="width: 21%">Instructor Title</th>' +
	'<th style="width: 8%"># in class</th>' +
	'<th style="width: 8%"># responses</th>' +
	'<th style="width: 8%">Response rate</th></tr>';

    for (var i = 0; i < class_data.length; i++) {
	if (is_selected(class_data[i], number)) {
	    subtable +=
		'<tr><td>' +
		'<a target="_blank" href="' + class_data[i].url + '">' +
		terms[class_data[i].term] +
		'</a></td><td>' +
		class_data[i].rating.format(1) +
		'</td><td>' +
		(class_data[i].ic_hours +
		 class_data[i].oc_hours).format(1) +
		'</td><td>';

	    // Hack to fix how professors were encoded.
	    for (k = 0; k < class_data[i].professors.length; k++) {
		if (prof_search === class_data[i].professors[k].name) {
		    subtable +=
			'<strong>' + class_data[i].professors[k].name
			+ '</strong><br>';
		} else {
		    subtable += class_data[i].professors[k].name + '<br>';
		}
	    }
	    subtable += '</td><td>';
	    for (k = 0; k < class_data[i].professors.length; k++) {
		if (prof_search === class_data[i].professors[k].name) {
		    subtable +=
			'<strong>' + class_data[i].professors[k].rating.format(1)
			+ '</strong><br>';
		} else {
		    subtable += class_data[i].professors[k].rating.format(1) + '<br>';
		}
	    }
	    subtable += '</td><td>';
	    for (k = 0; k < class_data[i].professors.length; k++) {
		if (prof_search === class_data[i].professors[k].name) {
		    subtable +=
			'<strong>' + class_data[i].professors[k].role
			+ '</strong><br>';
		} else {
		    subtable += class_data[i].professors[k].role + '<br>';
		}
	    }

	    subtable +=
		'</td><td>' + 
		class_data[i].eligible +
		'</td><td>' +
		class_data[i].resp +
		'</td><td>' +
		class_data[i].rate +
		'%</td></tr>';
	}
    }

    subtable += '</table>';
    
    return subtable;
}

function fill_table() {
    table.clear();

    for (var term in terms) {
	buttons[term] = $("#" + term).attr("aria-pressed") === "true";
    }

    prof_search = $("#prof-search").val();
    hass_a_active = $("#hass-a").is(":checked");
    hass_h_active = $("#hass-h").is(":checked");
    hass_s_active = $("#hass-s").is(":checked");
    ci_h_active = $("#ci-h").is(":checked");
    ci_hw_active = $("#ci-hw").is(":checked");
    // next_active = $("#next-term").is(":checked");
    
    for (var class_number in evals) {
	var total_eval = {
	    number: class_number,
	    rating: 0,
	    total_hours: 0,
	    ic_hours: 0,
	    oc_hours: 0,
	    class_name: "",
	    term_count: 0,
	    eligible: 0,
	    resp: 0
	};
	
	for (var j = 0; j < evals[class_number].length; j++) {
	    if (is_selected(evals[class_number][j], class_number) &&
	       evals[class_number][j].resp > 0) {
	   	total_eval.rating += evals[class_number][j].rating;
	   	total_eval.ic_hours += evals[class_number][j].ic_hours;
	   	total_eval.oc_hours += evals[class_number][j].oc_hours;
	   	total_eval.class_name = evals[class_number][j].class_name;
		total_eval.eligible += evals[class_number][j].eligible;
		total_eval.resp += evals[class_number][j].resp;
	   	total_eval.term_count++;
	    }
	}
	
	if (total_eval.term_count > 0) {
	    total_eval.rating /= total_eval.term_count;
	    total_eval.ic_hours /= total_eval.term_count;
	    total_eval.oc_hours /= total_eval.term_count;
	    total_eval.total_hours = total_eval.ic_hours + total_eval.oc_hours;

	    table.rows.add([[total_eval.number,
	   		     total_eval.rating.format(1),
	   		     total_eval.total_hours.format(1),
	   		     total_eval.class_name,
	   		     total_eval.eligible,
	   		     total_eval.resp]]);
	    
	}
    }
    
    table.draw();

    search_setup();

    // If professor search is active, expand all rows
    if (prof_search != '') {
	table.rows().every( function () {
	    this.child(format_subtable(evals[this.data()[0]])).show();
            $(this.node()).addClass('shown');
	} );
    }

    $('#apply').blur();
}

$(document).ready(function() {
    $('#eval-table tfoot th').each( function () {
        var title = $(this).text();
        $(this).html( '<input type="text" placeholder="Search '+title+'" />' );
    } );

    table = $("#eval-table").DataTable( {
	"iDisplayLength": 100,
	"sDom": "tp",
	"deferRender": true,
	"order": [[4, "desc"]],
	"columnDefs": [
	    { targets: [0],
	      type: "class",
	      render: function ( data, type, row, meta ) {
                  if (type === 'display'){
                      data =
			  '<a href="http://student.mit.edu/catalog/search.cgi?search='
			  + data + '" target="_blank">' + data + '</a>';
                }

                return data;
              } }
	]
    });

    fill_table();
    
    $("#eval-loading").hide();
    $("#eval-table-div").show();

    table.columns.adjust().draw();

    $('#eval-table tbody').on('click', 'tr', function () {
        var tr = $(this).closest('tr');
        var row = table.row(tr);
 
        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
	    try {
		var number = row.data()[0];
		row.child(format_subtable(evals[number], number)).show();
		tr.addClass('shown');
	    } catch (e) {};
        }
    } );

    $('#prof-search').typeahead({ source: professors });

    $('#all-terms').click(function () {
	for (var term in terms) {
	    $("#" + term).attr("aria-pressed", "true");
	    $("#" + term).addClass("active");
	}
    });

    $('#nall-terms').click(function () {
	for (var term in terms) {
	    $("#" + term).attr("aria-pressed", "false");
	    $("#" + term).removeClass("active");
	}
    });

    $('#show-terms').click(function () {
	$('#show-terms').hide();
	$('#hide-terms').show();
	$('#terms-div').show();
    });

    $('#hide-terms').click(function () {
	$('#show-terms').show();
	$('#hide-terms').hide();
	$('#terms-div').hide();
    });
			   
});
