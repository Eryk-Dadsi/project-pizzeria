import { templates } from '../settings.js';
import utils from '../utils.js';


class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);

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
}


export default Home;