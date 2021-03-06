import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import amountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.tableNumber;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();

  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);

    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],

    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),

      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),

      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };


    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;


    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {

      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {

      table.classList.remove(classNames.booking.tablePicked);
      thisBooking.tableNumber = null;

      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      }
      else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.element = utils.createDOMFromHTML(generatedHTML);

    thisBooking.dom = {};

    thisBooking.dom.wrapper = element;

    thisBooking.dom.wrapper.appendChild(thisBooking.element);

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);

    thisBooking.starters = [];
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new amountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new amountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);



    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function (event) {
      thisBooking.initTables(event);
    });

    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });

    thisBooking.dom.form.addEventListener('click', function (event) {

      if (event.target.getAttribute('type') === 'checkbox') {

        const input = event.target;
        const value = event.target.getAttribute('value');

        if (input.checked) {

          thisBooking.starters.push(value);
        }
        else if (!input.checked) {

          const indexOfValue = thisBooking.starters.indexOf(value);
          thisBooking.starters.splice(indexOfValue, 1);

        }
      }
    });

  }

  initTables(event) {
    const thisBooking = this;
    event.preventDefault();

    const tableDOM = event.target;
    const targetTableId = tableDOM.getAttribute(settings.booking.tableIdAttribute);

    if (tableDOM.classList.contains(classNames.booking.table)
      && !tableDOM.classList.contains(classNames.booking.tableBooked)) {


      for (let table of thisBooking.dom.tables) {

        const tableId = table.getAttribute(settings.booking.tableIdAttribute);

        if (tableId == targetTableId) {

          if (!table.classList.contains(classNames.booking.tablePicked)) {
            tableDOM.classList.add(classNames.booking.tablePicked);
            thisBooking.tableNumber = targetTableId;

          } else if (table.classList.contains(classNames.booking.tablePicked)) {
            tableDOM.classList.remove(classNames.booking.tablePicked);
            thisBooking.tableNumber = null;
          }

        } else if (tableId != targetTableId) {
          table.classList.remove(classNames.booking.tablePicked);
        }

      }

    } else if (tableDOM.classList.contains(classNames.booking.table)
      && tableDOM.classList.contains(classNames.booking.tableBooked)) {
      alert('Stolik jest niedost??pny');
    }


  }

  sendBooking() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;

    const reservation = {};

    reservation.address = thisBooking.dom.address.value;
    reservation.phone = thisBooking.dom.phone.value;
    reservation.date = thisBooking.datePicker.value;
    reservation.hour = thisBooking.hourPicker.value;
    reservation.table = parseInt(thisBooking.tableNumber);
    reservation.duration = thisBooking.hoursAmount.value;
    reservation.ppl = thisBooking.peopleAmount.value;
    reservation.starters = thisBooking.starters;


    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservation),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function (parsedResponse) {

        console.log('parsedResponse', parsedResponse);
      }).then(thisBooking.makeBooked(reservation.date, reservation.hour, reservation.duration, reservation.table));


  }

}

export default Booking;