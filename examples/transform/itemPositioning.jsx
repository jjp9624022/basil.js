#includepath "~/Documents/;%USERPROFILE%Documents";
#include "basiljs/bundle/basil.js";

function draw() {
  
  b.doc();
  b.clear(b.doc());
  
  b.units(b.MM); // use millimeter
  b.noStroke();
  b.fill(100); // black
  
  b.ellipseMode(b.CORNER); // please note that currently other positioning modes are not supported with itemPosition(), etc...
  var ell = b.ellipse( b.width / 2, b.height / 2, 30, 30 );

  b.delay(1000);
  
  b.itemX(ell, 30);
  b.delay(1000);
  
  b.itemY(ell, 30);
  b.delay(1000);
  
  b.itemPosition(ell, b.width / 2, b.height / 2);
  b.delay(1000);

  b.itemWidth(ell, 50);
  b.delay(1000);
  
  b.itemHeight(ell, 50);  
  b.delay(1000);  
  
  b.itemSize(ell, 30, 30);  
  b.delay(1000);  
  
  for(var i = 0; i < 50; i++) {
    
    b.itemX( ell, b.itemX(ell) + 2 );
    b.delay(30); 
  }

  ell.remove();

}

b.go();