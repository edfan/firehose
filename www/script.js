var table;

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

function fill_table() {
    table.clear();
    
    for (i = 0; i < evals.length; i++) {
	for (var class_number in evals[i]) {
	    var class_data = {
		number: class_number,
		rating: 0,
		total_hours: 0,
		ic_hours: 0,
		oc_hours: 0,
		name: "",
		term_count: 0
	    };
	    
	    for (j = 0; j < evals[i][class_number].length; j++) {
		var term_eval = evals[i][class_number][j];
		if ($("#" + term_eval.term).attr("aria-pressed") === "true") {
		    class_data.rating += Number(term_eval.rating);
		    class_data.ic_hours += Number(term_eval.ic_hours);
		    class_data.oc_hours += Number(term_eval.oc_hours);
		    class_data.name = term_eval.class_name;
		    class_data.term_count++;
		}
	    }
	    
	    if (class_data.term_count > 0) {
		class_data.rating /= class_data.term_count;
		class_data.ic_hours /= class_data.term_count;
		class_data.oc_hours /= class_data.term_count;
		class_data.total_hours = class_data.ic_hours + class_data.oc_hours;

		table.rows.add([[class_data.number,
				 class_data.rating.format(1),
				 class_data.total_hours.format(1),
				 class_data.name,
				 class_data.ic_hours.format(1),
				 class_data.oc_hours.format(1)]]);
			     
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
