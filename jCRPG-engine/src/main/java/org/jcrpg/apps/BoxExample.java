/**
 * Copyright (c) 2008-2010 Ardor Labs, Inc.
 *
 * This file is part of Ardor3D.
 *
 * Ardor3D is free software: you can redistribute it and/or modify it 
 * under the terms of its license which may be found in the accompanying
 * LICENSE file or at <http://www.ardor3d.com/LICENSE>.
 */

package org.jcrpg.apps;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;

import org.jcrpg.threed.ModelLoader;
import org.jcrpg.threed.core.AppBase;
import org.jcrpg.threed.core.loader.ObjToArdor3d;
import org.jcrpg.threed.engine.moving.AnimatedModelNode;
import org.jcrpg.threed.scene.model.moving.MovingModelAnimDescription;
import org.jcrpg.ui.FontUtils;
import org.jcrpg.world.ai.fauna.mammals.gorilla.GorillaHorde;
import org.jcrpg.world.ai.humanoid.group.boarman.BoarmanTribe;
import org.jcrpg.world.ai.humanoid.group.myth.greek.member.HellPig;

import com.ardor3d.image.Texture;
import com.ardor3d.image.TextureStoreFormat;
import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.MathUtils;
import com.ardor3d.math.Matrix3;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.state.MaterialState;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.renderer.state.MaterialState.ColorMaterial;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.Spatial;
import com.ardor3d.util.ReadOnlyTimer;
import com.ardor3d.util.TextureManager;
import com.ardor3d.util.export.binary.BinaryImporter;
import com.ardor3d.util.resource.ResourceLocatorTool;
import com.ardor3d.util.resource.SimpleResourceLocator;
import com.jmex.audio.AudioSystem;
import com.jmex.audio.AudioTrack;
import com.jmex.audio.AudioTrack.TrackType;

/**
 * A simple example showing a textured and lit box spinning.
 */

public class BoxExample extends AppBase {

    /** Keep a reference to the box to be able to rotate it each frame. */
    private Node box;

    /** Rotation matrix for the spinning box. */
    private final Matrix3 rotate = new Matrix3();

    /** Angle of rotation for the box. */
    private double angle = 0;

    /** Axis to rotate the box around. */
    private final Vector3 axis = new Vector3(1, 1, 0.5f).normalizeLocal();

    public static void main(final String[] args) {
		//mesh = args[0];
		//anim = args[1];
        start2(BoxExample.class);
    }

    @Override
    protected void updateApp(final ReadOnlyTimer timer) {
    	AudioSystem.getSystem().update();
    	
        // Update the angle using the current tpf to rotate at a constant speed.
        angle += timer.getTimePerFrame() * 50;
        // Wrap the angle to keep it inside 0-360 range
        angle %= 360;

        // Update the rotation matrix using the angle and rotation axis.
        rotate.fromAngleNormalAxis(angle * MathUtils.DEG_TO_RAD, axis);
        // Update the box rotation using the rotation matrix.
        box.setRotation(rotate);
    }

	static String mesh = null;
	static String anim = null;

    
    @Override
    protected void initApp() {
        _canvas.setTitle("Box Example");
        
        ModelLoader l = new ModelLoader(null); 
        

  
        
        ObjToArdor3d objtojme = new ObjToArdor3d();
		try {
	        AudioTrack mainTheme = AudioSystem.getSystem().createAudioTrack(new File("../media/audio/music/fantasy/fantasy_menu.ogg").toURL(), true);
			mainTheme.setType(TrackType.MUSIC);
			mainTheme.setRelative(false);
			mainTheme.setLooping(true);
			mainTheme.setVolume(1f);
			mainTheme.play();
			SimpleResourceLocator loc1 = new SimpleResourceLocator(new File(
			"./data/models/fauna/gorilla").toURI());
			ResourceLocatorTool.addResourceLocator(
					ResourceLocatorTool.TYPE_TEXTURE, loc1);
			MovingModelAnimDescription des = new MovingModelAnimDescription();
			des.IDLE = anim;

			Jcrpg.TOOL_SESSION = true;
			AnimatedModelNode n = new AnimatedModelNode(HellPig.hellPig.modelName,
					HellPig.hellPig.animation, 0.1f, new float[] {
							0, 0, 0 }, 1f); 
				n.setScale(5, 5, 5);

			n = new AnimatedModelNode(GorillaHorde.gorilla.modelName,
					GorillaHorde.gorilla.animation, 0.1f, new float[] {
							0, 0, 0 }, 1f); 
			n.setScale(51, 51, 51);

			AnimatedModelNode n2 = new AnimatedModelNode(BoarmanTribe.boarmanMale.modelName,
					BoarmanTribe.boarmanMale.animation, 0.1f, new float[] {
							0, 0, 0 }, 1f); 
			n2.setScale(100, 100, 100);

			Node slottextNode = FontUtils.textNonBoldVerdana.createOutlinedText(("ALMA"), 1f, new ColorRGBA(0.9f,0.9f,0.9f,1f),ColorRGBA.RED,false);
			// slottextNode = FontUtils.textNonBoldVerdana.createText(("ALMA"), 2f, new ColorRGBA(0.9f,0.9f,0.9f,1f),false);
			slottextNode.setScale(1.35, 1.35, 1.35);
//			n.attachChild(slottextNode);
			
			
			/*n = new AnimatedModelNode(GorillaHorde.gorilla.modelName,
					GorillaHorde.gorilla.animation, 1f, new float[] {
							0, 0, 0 }, 1f);*/ 
			// ns.setLocalTranslation(new Vector3f(i/4,2f+(i%4)2f,0));
			// n = new AnimatedModelNode
			// (BoarmanTribe.boarmanMaleMage.modelName,BoarmanTribe.
			// boarmanMaleMage.animation,1f,true);;
			n.changeToAnimation(MovingModelAnimDescription.ANIM_IDLE_COMBAT);
			com.ardor3d.renderer.state.CullState s = new com.ardor3d.renderer.state.CullState();
			s.setCullFace(com.ardor3d.renderer.state.CullState.Face.None);

			
			
			ResourceLocatorTool.addResourceLocator(ResourceLocatorTool.TYPE_TEXTURE, new SimpleResourceLocator(new File("../media/texture/low").toURI()));
			ResourceLocatorTool.addResourceLocator(ResourceLocatorTool.TYPE_TEXTURE, new SimpleResourceLocator(new File("../media/texture/common").toURI()));
			objtojme.setProperty("mtllib",new File("../media/models/fauna/").toURI().toURL());
			ByteArrayOutputStream bytearrayoutputstream = new ByteArrayOutputStream(); 
			FileInputStream is = new FileInputStream(new File("../media/models/fauna/redfox.obj"));
			objtojme.convert(is, bytearrayoutputstream);
			byte[] bytes = (bytearrayoutputstream.toByteArray());
			ByteArrayInputStream in = new ByteArrayInputStream(bytes);
			BinaryImporter binaryImporter = new BinaryImporter(); 
		    //importer returns a Loadable, cast to Node
			Node node = new Node();
			Spatial spatial = (Spatial)binaryImporter.load(in);
			//spatial.setModelBound(new BoundingBox());
			// TODO ardor3d spatial.updateModelBound();
			node.attachChild(spatial);
	//		node.attachChild(n);
			node.attachChild(slottextNode);
				
			
			
			
			box = node;
		} catch (Exception ex)
		{
			
		}
        
        //SimpleModel cave_rock = new SimpleModel("models/ground/cave_rock.obj", null);
        //box = l.loadNodeOriginal(cave_rock, false);
        
        // Create a new box centered at (0,0,0) with width/height/depth of size 10.
        //box = new Box("Box", new Vector3(0, 0, 0), 5, 5, 5);
        // Set a bounding box for frustum culling.
        //box.setModelBound(new BoundingBox());
        // Move the box out from the camera 15 units.
        box.setTranslation(new Vector3(0, 0, -5));
        // Give the box some nice colors.
        //box.setRandomColors();
        // Attach the box to the scenegraph root.
        _root.attachChild(box);

        // Add a texture to the box.
        final TextureState ts = new TextureState();
        ts.setTexture(TextureManager.load("images/ardor3d_white_256.jpg", Texture.MinificationFilter.Trilinear,
        		TextureStoreFormat.GuessNoCompressedFormat, true));
        box.setRenderState(ts);

        // Add a material to the box, to show both vertex color and lighting/shading.
        final MaterialState ms = new MaterialState();
        ms.setColorMaterial(ColorMaterial.Diffuse);
        box.setRenderState(ms);
    }

}
