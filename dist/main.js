// APP START
function startApp() {
  var initLatLng = { lat: 41.657447, lng: 26.591756 }; // varsayılan lokasyon
  if (navigator.geolocation) {
    // cihazın konum bilgisini alma
    navigator.geolocation.getCurrentPosition(function (position) {
      initLatLng.lat = position.coords.latitude;
      initLatLng.lng = position.coords.longitude;
      initialize(initLatLng.lat, initLatLng.lng);
    }, function () {
      initialize(initLatLng.lat, initLatLng.lng);
    });
  } else {
    initialize(initLatLng.lat, initLatLng.lng);
  }
}

var map = null;

function initialize(lat, lng) {
  map = new MapCtrl(lat, lng);
  map.zoom = 13;
  map.initMap(); // harita yükleme
  map.mapSetContainerArea("TOP_LEFT", "Harita Seçim OOP Ödev"); // marita üzerinde alan

  // şekil seçildikten sonra tetiklenecek event
  document.addEventListener("selected-shape", shapeAddModalOpen);
  document.addEventListener("selected-shape-clear", shapeAddModalClose);
  loadShapeList();
}

function loadShapeList() {
  // sıfırlama
  document.getElementById('container-shape-list').innerHTML = '';
  // kayıtlı içerikleri html içine aktarma
  shapesList.orderBy('createdDate', 'desc').get().then(res => {
    if (res.size) {
      document.getElementById('container-shape-list').append('Kayıtlı Şekiller:');
      res.forEach(shape => {
        var li = document.createElement('li');
        li.id = shape.id;
        li.setAttribute('class', 'container-shape-list-item');
        li.setAttribute('onclick', 'loadGetShapeData(this)');
        li.append(shape.data().title);
        document.getElementById('container-shape-list').append(li);
      });
      document.getElementById('container-shape-list').style.display = 'block';
    } else {
      document.getElementById('container-shape-list').append('Kayıt Bulunmamaktadır');
      document.getElementById('container-shape-list').style.display = 'block';
    }
  });
}


function loadGetShapeData(itemObj) {
  if (itemObj.id) {
    shapesList.doc(itemObj.id).get().then(function (res) {
      if (res.exists) {
        setMapShape(res.data().paths, res.data().zoom, {
          id: itemObj.id,
          title: res.data().title,
          desc: res.data().desc
        });
      } else {
        alert('Veri Kaydı Eksik');
      }
    });
  }
}


var currentShape = null;

function shapeAddModalOpen() {
  currentShape = map.selectedShape;
  document.getElementById('container-shape-modal').style.display = 'block';
  document.getElementById('btn-shape-db').style.display = 'inline-block';
  document.getElementById('btn-shape-edit-open').innerHTML = '+ Ekle';
  if (currentShape.db) {
    document.getElementById('btn-shape-edit-open').innerHTML = 'Düzenle';
    document.getElementById('btn-shape-db').style.display = 'none';
    document.getElementById('btn-shape-db-update').style.display = 'inline-block';
    document.getElementById('btn-shape-db-delete').style.display = 'inline-block';
    document.getElementById('input-shape-name').value = currentShape.dbData.title;
    document.getElementById('input-shape-desc').value = currentShape.dbData.desc;
  }
}

function shapeAddModalClose() {
  document.getElementById('container-shape-edit-detail').style.display = 'none';
  document.getElementById('container-shape-modal').style.display = 'none';
  document.getElementById('btn-shape-db-update').style.display = 'none';
  document.getElementById('btn-shape-db-delete').style.display = 'none';
  clearInputs();
}

function clearInputs() {
  document.getElementById('input-shape-name').value = null;
  document.getElementById('input-shape-desc').value = null;
}

function shapeEditDetailOpen() {
  document.getElementById('container-shape-edit-detail').style.display = 'block';
}

function deleteShape() {
  shapeAddModalClose();
  map.deleteSelectedShape();
}

function shapeDBDelete() {
  var deleteShape = new Shape();
  deleteShape.delete(currentShape.dbData.id).then(function () {
    map.deleteSelectedShape();
    shapeAddModalClose();
    loadShapeList();
    alert('Silme Başarılı');
  }).catch(err => console.log('Beklenmedik Hata', err));
}

function saveShapeDB() {
  var title = document.getElementById('input-shape-name').value;
  var desc = document.getElementById('input-shape-desc').value;
  if (currentShape) {
    if (currentShape.type && currentShape.latLngList, title, desc) {
      var paths = [];
      currentShape.latLngList.forEach(latlng => {
        paths.push({ lat: latlng.lat(), lng: latlng.lng() });
      });
      var shape = new Shape(currentShape.type, paths, title, desc, this.map.map.getZoom());
      if (currentShape.db) {
        shape.update(currentShape.dbData.id).then(function () {
          shapeAddModalClose();
          loadShapeList();
          alert('Kayıt Başarılı');
        }).catch(function (err) {
          console.log(err);
          alert('Beklenmedik Hata');
        });
      } else {
        shape.save().then(function () {
          shapeAddModalClose();
          loadShapeList();
          alert('Kayıt Başarılı');
        }).catch(function (err) {
          console.log(err);
          alert('Beklenmedik Hata');
        });
      }
      this.map.clearSelectShape();
    } else {
      if (!title && !desc) {
        alert('Başlık ve Açıklama alanlarını doldurunuz');
        return;
      }
      alert('Eksik bilgi girişi yapılmıştır');
    }
  }
}


function saveShapeDBCancel() {
  if (currentShape) {
    document.getElementById('container-shape-edit-detail').style.display = 'none';
  }
}

function setMapShape(_paths, _zoomLevel, data = { id: null, title: null, desc: null }, ) {
  map.drawingManager.setDrawingMode(null);
  map.setMapZoom(_zoomLevel);
  map.setMapShape(_paths, { id: data.id, title: data.title, desc: data.desc });
  map.setMapCenter(_paths[0]);
}

function adresDetayKapat() {
  map.detailBoxHidden();
}