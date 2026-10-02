import roryHello from '../rory-hello/index';

// Same animation and music as "Rory Says Hello". The captions turn it into a joke for adults.
// Times line up with the beat sheet in rory-hello/index.js.
export default {
  ...roryHello,
  id: 'rory-friday',
  title: 'Rory: Friday 5 PM',
  captions: [
    { from: 0.2, to: 11.8, at: 'top', text: 'me leaving work at\n5:00 PM on a Friday' },
    { from: 2.6, to: 4.8, at: 'bottom', text: 'bye boss 👋' },
    { from: 5.0, to: 6.6, at: 'bottom', text: 'WEEKEND!!!', size: 0.13, color: '#ffe08a' },
    { from: 6.9, to: 9.6, at: 'bottom', text: 'hugging my couch already' },
    { from: 9.8, to: 11.8, at: 'bottom', text: '(do not disturb until Monday)', size: 0.065 },
  ],
};
