const json = null

const stackedChart = document.getElementById("stackedChart").getContext('2d');
const pieChart = document.getElementById('pieChart')
const appList = document.querySelector(".applist")
const datepicker = document.getElementById('datepicker')
const screenTime = document.getElementById('screenTime')
const selectedDate = document.querySelectorAll('.selectedDate')
const mostUsedApp = document.getElementById('mostUsedApp')
const errorReport = document.getElementById('errorReport')

// HH:MM:SS on stacked, and maybe also pieChart

const times = ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
const numbers = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']


function datepicker_load() {
	// Finds the first & last dates
  let first_date = ""
  let last_date = ""
	let i = 0
	for (index in json) {
		for (key in json[index]) {
			if (i == 0) {
				first_date = key
				i++
			}
			last_date = key
		}
	}

	// Set the min and max date attributes in the datepicker
	datepicker.setAttribute('min', first_date)
	datepicker.setAttribute('max', last_date)

  // return last date, used for other parts of the site
  return last_date
}

function totalPerHour(date, min_app_time, backgroundColors) {
  // Find the list index for the date
  let index = 0
  for (let i = 0; i < json.length; i++) {
    if (json[i][date]) {
      index = i
      break
    }
  }

  // Calculate the total seconds per hour
  let appHour = 0
  let totalApp = []
  let allApps = []
  for (const key in json[index][date]) {
    totalApp = []
    for (let i = 0; i < 24; i++) {
      appHour = json[index][date][key][numbers[i]]
      totalApp.push(appHour)
    }
    if (appMinTime(totalApp, min_app_time)) {
      if (backgroundColors) {
        allApps.push({'label': key, 'data': totalApp, 'backgroundColor': labelToColor(key, backgroundColors)})
      } else {
        allApps.push({'label': key, 'data': totalApp})
      }
    }
  }
  console.log(allApps)
  return allApps
}

function secondsToTime(value) {
  minutes = Math.floor(value / 60)
  seconds = value - (minutes * 60)
  return (`${minutes.toString().padStart(2, '0')}:${String(seconds).toString().padStart(2, '0')}`)
}

function secondsToPie(value) {
  return new Date(value * 1000).toISOString().slice(11, 19)
}

function appMinTime(total, min_time) {
  // Only shows app that were on-screen for > 60s 
  for (let i = 0; i < 24; i++) {
    if (total[i] > min_time) {
      return true
    }
  }
  return false
}

function colorFromPie(pieData) {
  let backgroundColors = []
  for (let i = 0; i < pieData.labels.length; i++) {
    backgroundColors.push({'label': pieData['labels'][i], 'backgroundColor': pieData['datasets'][0]['backgroundColor'][i]})
  }
  return backgroundColors
}

function labelToColor(name, backgroundColors) {
  for (i in backgroundColors) {
    current = backgroundColors[i]
    if (current.label == name) {
      return current.backgroundColor
    }
  }
}

function totalByApp(allApps) {
  let totalByApps = []
  let appName = ""
  for (i in allApps) {
    let totalApp = 0
    appName = allApps[i]['label']
    for (hour in allApps[i]['data']) {
      let current = allApps[i]['data'][hour]
      if (current) {
        totalApp += current
      }
    }
    totalByApps.push({'appName': appName, 'totalApp' : totalApp})
  }

  // Sort the array from greatest to least
  return totalByApps
}

function sortByTotalApp(total) {
	total.sort(function(a, b){return b.totalApp - a.totalApp})
  return total
}

function screenTimeFromAppsTotal(array) {
  total = 0
  for (i = 0; i < array.length; i++) {
    total += array[i]['totalApp']
  }
  return total
}

function appsToList(appsTotal) {
  // Clear the list
  appList.innerHTML = ""

  // Add the apps to html list
  for (i in appsTotal) {
    appList.innerHTML += `
    <li>
      <span class="appname">${appsTotal[i]['appName']}</span>
      <span class="apptime">${new Date(appsTotal[i]['totalApp'] * 1000).toISOString().slice(11, 19)}</span>
    </li>
    `
  } 
}

function getPieData(appsTotal) {
  for (let i = 0; i < appsTotal.length; i++) {
    pieLabels.push(appsTotal[i]['appName'])
    pieDatasets.push(appsTotal[i]['totalApp'])
  }
}

function updateHtml(date, appsTotal) {
  // Update screen-on-time
  if (appsTotal) {
    screenTime.textContent = new Date(screenTimeFromAppsTotal(appsTotal) * 1000).toISOString().slice(11,19)
    // Update most used app
    mostUsedApp.textContent = `${appsTotal[0]['appName']} (${new Date(appsTotal[0]['totalApp'] * 1000).toISOString().slice(11,19)})`
  } else {
    screenTime.textContent = '00:00:00'
    mostUsedApp.textContent = 'none'
  }

  // Update calendar selected date
  datepicker.value = date

  // Change all the indicators for selected date on html
  selectedDate.forEach(function(element) {
    element.textContent = date
  })
}






// Main
// Initialize datepicker, which returns the latest date —which becomes SELECTED_DATE— from the JSON.
let SELECTED_DATE = datepicker_load()

// Get data for appList (and piechart)
let appsTotal = sortByTotalApp(totalByApp(totalPerHour(SELECTED_DATE, 0)))
// Append to appList
appsToList(appsTotal)

// Data for pie chart (data for stacked chart has to be taken after the pie chart, to steal colors from pie chart)
let pieLabels = []
let pieDatasets = []
getPieData(appsTotal)

// Update all of the HTML that requires updating
updateHtml(SELECTED_DATE, appsTotal)





// Chartjs config
// Pie Chart
console.log(pieLabels, pieDatasets)
let pieData = {
  labels: pieLabels,
  datasets: [{
    label: "Time",
    data: pieDatasets
  }]
}
const pieConfig = {
  type: 'doughnut',
  data: pieData,
  options: {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed
            console.log(value)
            return `${context.dataset.label}: ${secondsToPie(value)}`
          }
        }
      },
      legend: {
        display: false,
      }
    }
  }
}

let chartjs_pie = new Chart(pieChart, pieConfig);
let backgroundColors = colorFromPie(chartjs_pie.data)



// Stacked Bar Chart, takes the colors for each app from the pieChart, so we have to initialize after the pie chart.
let stackedData = {
    labels: times,
    datasets: totalPerHour(SELECTED_DATE, 60, backgroundColors)
}
const stackedConfig = {
  type:'bar',
  data: stackedData,
  options: {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      },
      y: {
        type: 'linear',
        ticks: {
          callback: function(value) {
            return secondsToTime(value)
          },
          stepSize: 600,
          color: 'white'
        },
        max: 3600,
        stacked: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.15)'
        },
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y
            return `${context.dataset.label}: ${secondsToTime(value)}`
          }
        }
      },
      colorschemes: {
        scheme: 'brewer.Paired12' // You can change the color scheme as needed
      },
      legend: {
        labels: {
          color: 'white'
        }
      }
    }
  }
}
let chartjs_stacked = new Chart(stackedChart, stackedConfig)
console.log(chartjs_stacked)




function changeDate(dateFromArrows) {
  let date = ""
  if (dateFromArrows) {
    date = dateFromArrows
  } else {
    date = datepicker.value
  }
  // Makes sure the date is selected
  if (date) {
    try {
      // Update the SELECTED_DATE
      SELECTED_DATE = date

      // Update appsTotal to the new date
      appsTotal = sortByTotalApp(totalByApp(totalPerHour(SELECTED_DATE, 0)))

      // Replace the appList
      appsToList(appsTotal)

      // Data for pie chart
      pieLabels = []
      pieDatasets = []
      getPieData(appsTotal)

      // Update PieChart Data
      chartjs_pie.data = {labels: pieLabels, datasets: [{label:"Time (mins)", data: pieDatasets}]}

      // Update the charts
      chartjs_pie.update()

      // Get data for and update StackedChart
      backgroundColors = colorFromPie(chartjs_pie.data)
      chartjs_stacked.data.datasets = totalPerHour(SELECTED_DATE, 60, backgroundColors)

      chartjs_stacked.update()
      // Update the HTML information, current dates, screen-on-time
      updateHtml(SELECTED_DATE, appsTotal)
      // No errors.
      errorReport.innerHTML = ""
    }
    catch(err) {
      console.log(err)
      // If data for the date doesn't exist.
      errorReport.innerHTML = "No information available for that date."      
      SELECTED_DATE = date
      // appsTotal will have everything be undefined by this point, so screenontime = 0
      updateHtml(SELECTED_DATE)

      chartjs_pie.data = null
      // I have to keep the labels (0:00-23:00) on data, and to prevent an error logged to console, I will put data with label 'nothing'
      chartjs_stacked.data.datasets = [{label: 'nothing', data: []}]

      chartjs_pie.update()
      chartjs_stacked.update()
    }
  } else {
    // If no date is selected
    errorReport.innerHTML = "Please select a date."
  }
}

function arrows(direction) {
  let date = new Date(SELECTED_DATE)

  if (direction == 1) {
    date.setDate(date.getDate() + 1)
  } else if (direction == -1) {
    date.setDate(date.getDate() - 1)
  }
  
  let new_date = (date.toISOString().slice(0, 10))
  changeDate(new_date)
}
