var table;
var terms = ['2015FA', '2015JA', '2015SP', '2015SU',
             '2016FA', '2016JA', '2016SP', '2016SU']
var buttons = {};

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

function all_pressed(class_data) {
    for (j = 1; j < class_data.length; j++) {
	if (!(buttons[class_data[j].term])) {
	    return false;
	}
    }
    return true;
}

function fill_table() {
    table.clear();

    for (var term in terms) {
	buttons[term] = $("#" + term).attr("aria-pressed") === "true";
    }
    
    for (i = 0; i < evals.length; i++) {
	for (var class_number in evals[i]) {
	    // Fast path- return precomputed average for all
	    if (all_pressed(evals[i][class_number])) {
		var avg_eval = evals[i][class_number][0];
		table.rows.add([[class_number,
				 avg_eval.rating.format(1),
				 (avg_eval.ic_hours + avg_eval.oc_hours).format(1),
				 avg_eval.class_name,
				 avg_eval.ic_hours.format(1),
				 avg_eval.oc_hours.format(1)]]);
				 
	    }
	    // Otherwise, sum up totals manually and calculate average
	    else {	
		var total_eval = {
		    number: class_number,
		    rating: 0,
		    total_hours: 0,
		    ic_hours: 0,
		    oc_hours: 0,
		    class_name: "",
		    term_count: 0
		};
		
		for (j = 1; j < evals[i][class_number].length; j++) {
		    var term_eval = evals[i][class_number][j];
		    if (buttons[term_eval.term]) {
			total_eval.rating += Number(term_eval.rating);
			total_eval.ic_hours += Number(term_eval.ic_hours);
			total_eval.oc_hours += Number(term_eval.oc_hours);
			total_eval.class_name = term_eval.class_name;
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
				     total_eval.name,
				     total_eval.ic_hours.format(1),
				     total_eval.oc_hours.format(1)]]);
		    
		}
	    }
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
	    { targets: [0], type: "natural" }
	]
    });

    fill_table();

    table.columns.adjust().draw();
    $("#eval-loading").hide();
    $("#eval-table-div").show();
});
