
class MapCtrl {
  constructor(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.zoom = 18;

    this.map = null;
    this.mainMarker = null;
    this.drawingManager = null;
    this.selectedShape = null;
    this.selectedDbShape = null;
  }

  initMap() {
    var self = this;

    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: this.latitude, lng: this.longitude },
      zoom: this.zoom,
      disableDefaultUI: true,
    });

    this.mainMarker = new google.maps.Marker({
      position: { lat: this.latitude, lng: this.longitude },
      map: this.map,
      animation: google.maps.Animation.DROP,
      draggable: false,
    });

    var polyOptions = {
      strokeWeight: 0,
      fillOpacity: 0.3,
      editable: true,
      draggable: false
    };

    // şekil çizim aracı
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['polygon'], //'circle', 'rectangle', 
      },
      rectangleOptions: polyOptions,
      circleOptions: polyOptions,
      polygonOptions: polyOptions,
      map: this.map,
    });

    // harita üzerine tıklama event
    this.map.addListener('click', function (e) {
      self.openDetailBox(e.latLng.lat(), e.latLng.lng());
      self.mainMarker.setPosition(new google.maps.LatLng(e.latLng.lat(), e.latLng.lng()));
    });

    // yeni şekilden sonra event
    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', function (e) {
      var newShape = e.overlay;
      newShape.type = e.type;
      newShape.setEditable(false);
      self.drawingManager.setDrawingMode(null); // yeni şekil sonrası çizim aracı sıfırlanır

      // oluşan şekile tıklayınca
      google.maps.event.addListener(newShape, 'click', function () {
        self.setSelectShape(newShape, this);

        var newShapeSelf = this;
        // şekil üzerinde nokta değişikliği ve ekleme yapıldığında
        google.maps.event.addListener(newShape.getPath(), 'set_at', function () {
          self.setSelectShape(newShape, newShapeSelf);
        });
        google.maps.event.addListener(newShape.getPath(), 'insert_at', function () {
          self.setSelectShape(newShape, newShapeSelf);
        });
      });
    });

    // şekil modu değişince event
    google.maps.event.addListener(this.drawingManager, 'drawingmode_changed', function () {
      self.clearSelectShape();
    });
    // haritaya tıklayınca event
    google.maps.event.addListener(this.map, 'click', function () {
      self.clearSelectShape();
    });
  }

  // seçilen şeklin konumlarını ayıklar
  shapeCoordToArray(event) {
    var latLngList = [];
    if (event) {
      var vertices = event.getPath();
      for (var i = 0; i < vertices.getLength(); i++) {
        var xy = vertices.getAt(i);
        var latLng = new google.maps.LatLng(xy.lat(), xy.lng());
        latLngList.push(latLng);
      }
    }
    return latLngList;
  }

  setSelectShape(shape, shapeClickEvent = null, db = false) {
    if (shape.type !== 'marker') {
      this.clearSelectShape();
      shape.setEditable(true);
      shape.db = db;
      shape.latLngList = this.shapeCoordToArray(shapeClickEvent); // diktörtgen ve yuvarlak seçimlerinde sorun var
    }
    this.selectedShape = shape;
    var event = new CustomEvent('selected-shape');
    document.dispatchEvent(event);
  }

  clearSelectShape() {
    if (this.selectedShape) {
      if (this.selectedShape.type !== 'marker') {
        this.selectedShape.setEditable(false);
      }
      this.selectedShape = null;
    }
    var event = new CustomEvent('selected-shape-clear');
    document.dispatchEvent(event);
  }

  deleteSelectedShape() {
    if (this.selectedShape) {
      this.selectedShape.setMap(null);
    }
  }

  // listeden seçilen şeklin path lerine göre haritada gösterir
  setMapShape(_paths, dbShapeData) {
    if (this.selectedDbShape)
      this.selectedDbShape.setMap(null);
    this.selectedDbShape = new google.maps.Polygon({
      paths: _paths,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35
    });
    this.selectedDbShape.setMap(this.map);
    this.selectedDbShape.dbData = dbShapeData;
    var self = this;
    // oluşan şekile tıklayınca
    google.maps.event.addListener(this.selectedDbShape, 'click', function () {
      self.setSelectShape(self.selectedDbShape, this, true);
      var newShapeSelf = this;
      // şekil üzerinde nokta değişikliği ve ekleme yapıldığında
      google.maps.event.addListener(self.selectedDbShape.getPath(), 'set_at', function () {
        self.setSelectShape(self.selectedDbShape, newShapeSelf, true);
      });
      google.maps.event.addListener(self.selectedDbShape.getPath(), 'insert_at', function () {
        self.setSelectShape(self.selectedDbShape, newShapeSelf, true);
      });
    });
  }

  setMapZoom(zoomLevel = 18) {
    this.map.setZoom(zoomLevel);
  }

  setMapCenter(lat, lng) {
    this.map.setCenter(new google.maps.LatLng(lat, lng));
  }

  mapSetContainerArea(position, contentHtml) {
    var div = document.createElement('div');
    div.style.backgroundColor = '#fff';
    div.style.padding = '5px';
    div.style.fontSize = '16px';
    div.append(contentHtml);
    this.map.controls[google.maps.ControlPosition[position]].push(div);
  }

  openDetailBox(lat, lng) {
    this.detailBoxHidden();
    var self = this;
    var address = new CoordAddress(lat, lng);
    address.getCoordAdressData().then(function (res) {
      res = JSON.parse(res);
      var renderText = null;
      console.log(res);
      if (res.status == 'OK') {
        renderText = '<span>' + res.results[0].formatted_address + '</span><hr>';
        res.results[0].address_components.forEach(adr_comp => {
          renderText = renderText + '<p><b>' + adr_comp.types[0] + '</b>: ' + adr_comp.long_name + '</p>';
        });
      } else if (res.status == 'ZERO_RESULTS') {
        renderText = '<span>' + (res.plus_code.compound_code ? res.plus_code.compound_code : 'Geçersiz Seçim') + '</span>';
      } else {
        renderText = 'Hatalı Seçim';
      }
      renderText = renderText + '<button type="button" onclick="adresDetayKapat();">Kapat</button>'
      self.detailBoxShow();
      document.getElementById("container-detail").innerHTML = "<p style='white-space: pre-wrap;'>" + renderText + "</p>";
    });
  };

  detailBoxHidden() {
    document.getElementById("container-detail").classList.add('box-hidden');
    document.getElementById("container-detail").classList.remove('box-show');
  }

  detailBoxShow() {
    document.getElementById("container-detail").classList.remove('box-hidden');
    document.getElementById("container-detail").classList.add('box-show');
  }
}