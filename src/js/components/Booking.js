import { settings, templates, select } from '../settings.js'
import utils from '../utils.js'
import amountWidget from './AmountWidget.js'

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();

  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};

    thisBooking.dom.wrapper = element;
    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);

    thisBooking.element = utils.createDOMFromHTML(generatedHTML);

    thisBooking.dom.wrapper.appendChild(thisBooking.element);

  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new amountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new amountWidget(thisBooking.dom.hoursAmount);

    thisBooking.dom.peopleAmount.addEventListener('updated', function () { });
    thisBooking.dom.hoursAmount.addEventListener('updated', function () { });
  }
}




export default Booking;