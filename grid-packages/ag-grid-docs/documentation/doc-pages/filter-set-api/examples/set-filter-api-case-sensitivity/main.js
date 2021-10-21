var gridOptions = {
    columnDefs: [
      {
        headerName: 'Case Insensitive (default)',
        field: 'colourCode',
        filter: 'agSetColumnFilter',
        filterParams: {
          caseSensitive: false,
          cellRenderer: colourCellRenderer,
        },
      },
      {
        headerName: 'Case Sensitive',
        field: 'colourCode',
        filter: 'agSetColumnFilter',
        filterParams: {
          caseSensitive: true,
          cellRenderer: colourCellRenderer,
        },
      },
    ],
    defaultColDef: {
      flex: 1,
      minWidth: 225,
      cellRenderer: colourCellRenderer,
      resizable: true,
      floatingFilter: true,
    },
    sideBar: 'filters',
    onFirstDataRendered: onFirstDataRendered,
  };
  
  var FIXED_STYLES =
    'vertical-align: middle; border: 1px solid black; margin: 3px; display: inline-block; width: 10px; height: 10px';
  
  function colourCellRenderer(params) {
    var { value, data } = params;
    if (!value || value === '(Select All)') {
      return value;
    }
  
    var colourGroup = data ? data.colourGroup : value.split(':')[0];
  
    return `<div style="background-color: ${colourGroup.toLowerCase()}; ${FIXED_STYLES}"></div>${
      value
    }`;
  }
  
  function onFirstDataRendered(params) {
    params.api.getToolPanelInstance('filters').expandFilters();
  }
  
  // setup the grid after the page has finished loading
  document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);
  
      agGrid.simpleHttpRequest({ url: 'http://localhost:8000/large-colours.json' })
          .then(function(data) {
              gridOptions.api.setRowData(data);
          });
  
  });
  