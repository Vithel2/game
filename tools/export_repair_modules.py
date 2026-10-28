"""Export individual, centred tools from the prepared expansion .blend."""
import bpy, os
from mathutils import Vector, Matrix
OUT='/workspace/game/art/expansion_01'
bpy.ops.wm.open_mainfile(filepath=OUT+'/expansion_01.blend')
tools=bpy.data.collections['Phone_repair_tools']
modules={
 'precision_screwdriver':('Precision_driver','Driver_rotating','Handle_grip'),
 'tweezers':('Tweezers_',), 'nylon_spudger':('Nylon_spudger','Spudger_flat_tip'),
 'opening_pick':('Opening_pick',), 'suction_cup':('Suction_',),
 'micro_screw':('Tray_screw_01',)}
for name,prefixes in modules.items():
 originals=[o for o in tools.objects if o.name.startswith(prefixes)]
 bpy.context.view_layer.update()
 coords=[o.matrix_world@Vector(c) for o in originals if o.type!='EMPTY' for c in o.bound_box]
 low=Vector(tuple(min(v[i] for v in coords) for i in range(3)));high=Vector(tuple(max(v[i] for v in coords) for i in range(3)))
 pivot=(low+high)/2;pivot.z=low.z
 temp=bpy.data.collections.new('Export_'+name);bpy.context.scene.collection.children.link(temp);copies=[]
 for o in originals:
  if o.type=='EMPTY':continue
  c=o.copy();c.parent=None;c.matrix_parent_inverse=Matrix.Identity(4);temp.objects.link(c);c.matrix_world=o.matrix_world.copy();c.location-=pivot;c.hide_set(False);copies.append(c)
 bpy.ops.object.select_all(action='DESELECT')
 for c in copies:c.select_set(True)
 bpy.ops.export_scene.gltf(filepath=OUT+'/'+name+'.glb',use_selection=True,export_format='GLB',export_apply=True)
 for c in copies:bpy.data.objects.remove(c,do_unlink=True)
 bpy.data.collections.remove(temp)
 print('MODULE_OK',name)
