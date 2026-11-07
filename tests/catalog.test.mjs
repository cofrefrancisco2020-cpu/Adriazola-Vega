import {test} from 'node:test';
import assert from 'node:assert/strict';
import {money,normalize,validateProduct,whatsappLink,productLink} from '../catalog-core.js';
test('WhatsApp conserva nombre, código, precio y enlace del producto sin enviar mensajes',()=>{
  const p={id:'abcdefgh',name:'Filtro & Nissan + 4x4',sku:'ABC/123',price:15990};
  const url=new URL(whatsappLink(p,'56984484274','https://ejemplo.cl/taller/admin.html?demo=1'));
  assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/56984484274');
  const text=url.searchParams.get('text');assert.ok(text.includes(p.name));assert.ok(text.includes(p.sku));assert.ok(text.includes('$15.990'));
  assert.ok(text.includes('https://ejemplo.cl/taller/index.html?producto=abcdefgh#catalogo'));assert.ok(!text.includes('demo='));
  assert.throws(()=>whatsappLink(p,'javascript:alert(1)','https://ejemplo.cl'));
});
test('Precios y búsqueda funcionan con cero, sin precio y acentos',()=>{assert.equal(money(null),'Consultar precio');assert.equal(money(0),'$0');assert.equal(normalize('Suspensión NISSAN'),'suspension nissan');});
test('Rechaza precios negativos, fracciones, valores fuera del límite y descripciones vacías',()=>{
  const p={name:'Filtro',description:'Para Nissan',category_id:'test',price:null};assert.equal(validateProduct(p).price,null);
  for(const price of [-1,1.5,1000000000,NaN,Infinity])assert.throws(()=>validateProduct({...p,price}));
  assert.throws(()=>validateProduct({...p,description:' '}));assert.throws(()=>validateProduct({...p,category_id:null}));
  assert.equal(validateProduct({...p,name:'  Filtro  '}).name,'Filtro');
});
test('Enlace del producto usa una URL limpia y mantiene el subdirectorio de instalación',()=>{assert.equal(productLink('123','https://ejemplo.cl/web/admin.html#x'),'https://ejemplo.cl/web/index.html?producto=123#catalogo');});
