var table;
var terms = ['2015FA', '2015JA', '2015SP', '2015SU',
             '2016FA', '2016JA', '2016SP', '2016SU']
var buttons = {};

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

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

function is_selected(term_data) {
    if (!(buttons[term_data.term])) {
	return false;
    }

    var prof_search = $("#prof-search").val();
    if (prof_search != '') {
	for (var i = 0; i < term_data.professors.length; i++) {
	    if (term_data.professors[i].name === prof_search) {
		return true;
	    }
	}
	return false;
    }

    return true;
}

function format_subtable(class_data) {
    var subtable =
	'<table class="eval-subtable">' +
	'<th>Term</th>' +
	'<th>Rating</th>' +
	'<th>Hours (total)</th>' +
	'<th>Instructor</th>' +
	'<th>Rating</th>' +
	'<th>Instructor Title</th>' +
	'<th># in class</th>' +
	'<th># responses</th>' +
	'<th>Response rate</th>';

    var ps_val = $("#prof-search").val();

    for (var i = 0; i < class_data.length; i++) {
	if (is_selected(class_data[i])) {
	    subtable +=
		'<tr><td>' +
		class_data[i].term +
		'</td><td>' +
		class_data[i].rating.format(1) +
		'</td><td>' +
		(class_data[i].ic_hours +
		 class_data[i].oc_hours).format(1) +
		'</td><td>';

	    // Hack to fix how professors were encoded.
	    for (k = 0; k < class_data[i].professors.length; k++) {
		if (ps_val === class_data[i].professors[k].name) {
		    subtable +=
			'<strong>' + class_data[i].professors[k].name
			+ '</strong><br>';
		} else {
		    subtable += class_data[i].professors[k].name + '<br>';
		}
	    }
	    subtable += '</td><td>';
	    for (k = 0; k < class_data[i].professors.length; k++) {
		if (ps_val === class_data[i].professors[k].name) {
		    subtable +=
			'<strong>' + class_data[i].professors[k].rating.format(1)
			+ '</strong><br>';
		} else {
		    subtable += class_data[i].professors[k].rating.format(1) + '<br>';
		}
	    }
	    subtable += '</td><td>';
	    for (k = 0; k < class_data[i].professors.length; k++) {
		if (ps_val === class_data[i].professors[k].name) {
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

    for (var i = 0; i < terms.length; i++) {
	buttons[terms[i]] = $("#" + terms[i]).attr("aria-pressed") === "true";
    }
    
    for (var class_number in evals) {
	var total_eval = {
	    number: class_number,
	    rating: 0,
	    total_hours: 0,
	    ic_hours: 0,
	    oc_hours: 0,
	    class_name: "",
	    term_count: 0
	};
	
	for (var j = 0; j < evals[class_number].length; j++) {
	    if (is_selected(evals[class_number][j])) {
	   	total_eval.rating += evals[class_number][j].rating;
	   	total_eval.ic_hours += evals[class_number][j].ic_hours;
	   	total_eval.oc_hours += evals[class_number][j].oc_hours;
	   	total_eval.class_name = evals[class_number][j].class_name;
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
	   		     total_eval.ic_hours.format(1),
	   		     total_eval.oc_hours.format(1)]]);
	    
	}
    }
    
    table.draw();

    // Apply the search
    table.columns().every( function () {
        var that = this;
 
        $( 'input', this.footer() ).on( 'keyup change', function () {
            if ( that.search() !== this.value ) {
                that
                    .search("^" + this.value, true, false, true)
                    .draw();
            }
        } );
    } );

    if ($("#prof-search").val() != '') {
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
	"columnDefs": [
	    { targets: [0], type: "class" }
	]
    });

    fill_table();
    
    table.columns.adjust().draw();
    $("#eval-loading").hide();
    $("#eval-table-div").show();

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
            row.child(format_subtable(evals[row.data()[0]])).show();
            tr.addClass('shown');
        }
    } );

    $('#prof-search').typeahead({ source: professors });
});
