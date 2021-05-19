import { templates } from '../settings.js';
import utils from '../utils.js';
// import Flickity from '../flickity'

class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);
    thisHome.initPlugin();

  }

  render(element) {
    const thisHome = this;

    const generatedHTML = templates.homePage();

    thisHome.element = utils.createDOMFromHTML(generatedHTML);

    thisHome.dom = {};

    thisHome.dom.wrapper = element;

    thisHome.dom.wrapper.appendChild(thisHome.element);

    thisHome.dom.carousel = thisHome.dom.wrapper.querySelector('.main-carousel');
  }

  initPlugin() {
    const thisHome = this;
    // eslint-disable-next-line
    new Flickity(thisHome.dom.carousel, {
      // options
      autoPlay: true,
      wrapAround: true,
      prevNextButtons: false,
      pageDots: true,
      cellAlign: 'left',


    });
  }
}


export default Home;