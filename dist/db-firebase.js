// INIT FIREBASE
if (typeof firebase === 'undefined') throw new Error('hosting / init-error: Firebase SDK algılanmadı');
var config = {
  apiKey: "AIzaSyAh-3vnlSoEldRmuZ2Ed7tLIP5Xu7Rmjis",
  authDomain: "haritasec.firebaseapp.com",
  databaseURL: "https://haritasec.firebaseio.com",
  projectId: "haritasec",
  storageBucket: "haritasec.appspot.com",
  messagingSenderId: "513001294822"
};
firebase.initializeApp(config);

var db = firebase.firestore(); // db connect
var shapesList = db.collection('shapes'); // db collection