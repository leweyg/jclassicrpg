/*
 *  This file is part of JavaCRPG.
 *
 *  JavaCRPG is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation; either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  JavaCRPG is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.jcrpg.ui.meter;

import org.jcrpg.ui.HUD;
import org.jcrpg.ui.UIBase;
import org.jcrpg.world.time.Time;

import com.ardor3d.image.Texture;
import com.ardor3d.image.Texture.MinificationFilter;
import com.ardor3d.math.Quaternion;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.queue.RenderBucketType;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.scenegraph.hint.LightCombineMode;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.util.TextureManager;
import com.ardor3d.util.resource.ResourceLocatorTool;

/**
 * Direction and time-o-meter HUD element.
 * @author pali
 *
 */
public class DirectionTimeMeter {

	
	public HUD hud;
	
	
	public Quad quad;
	public Quad quad_sign_dir;
	public Quad quad_sign_sun;
	public Texture base_tex;
	public Texture sign_dir;
	public Texture sign_sun;
	
	public DirectionTimeMeter(HUD hud) throws Exception
	{
		this.hud = hud;
		base_tex = TextureManager.load(ResourceLocatorTool.locateResource(UIBase.RES_TYPE_UI, "meter.png"), MinificationFilter.BilinearNearestMipMap, true);
		sign_dir = TextureManager.load(ResourceLocatorTool.locateResource(UIBase.RES_TYPE_UI, "sign1.png"), MinificationFilter.BilinearNearestMipMap, true);
		sign_sun = TextureManager.load(ResourceLocatorTool.locateResource(UIBase.RES_TYPE_UI, "sign_sun.png"), MinificationFilter.BilinearNearestMipMap, true);

        TextureState state = new TextureState();
		state.setTexture(base_tex, 0);

		TextureState state1 = new TextureState();
		state1.setTexture(sign_dir, 0);
        
        TextureState state2 = new TextureState();
		state2.setTexture(sign_sun, 0);
		
		quad = new Quad("METER",hud.core.getDisplay().getWidth()/13, (hud.core.getDisplay().getHeight()/9));
		quad.setRenderState(state);
		quad.setRenderState(hud.hudAS);
        quad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);  
        quad.setTranslation(new Vector3((hud.core.getDisplay().getWidth()/24.7f),(hud.core.getDisplay().getHeight()/18.5f),0));
        quad.getSceneHints().setLightCombineMode(LightCombineMode.Off);
 
		quad_sign_dir = new Quad("SIGN_DIR",hud.core.getDisplay().getWidth()/13, (hud.core.getDisplay().getHeight()/9));
		quad_sign_dir.setRenderState(state1);
		quad_sign_dir.setRenderState(hud.hudAS);
        quad_sign_dir.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);  
        quad_sign_dir.setTranslation(new Vector3((hud.core.getDisplay().getWidth()/24.7f),(hud.core.getDisplay().getHeight()/18.5f),0));
        quad_sign_dir.getSceneHints().setLightCombineMode(LightCombineMode.Off);

		quad_sign_sun = new Quad("SIGN_SUN",hud.core.getDisplay().getWidth()/13, (hud.core.getDisplay().getHeight()/9));
		quad_sign_sun.setRenderState(state2);
		quad_sign_sun.setRenderState(hud.hudAS);
        quad_sign_sun.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);  
        quad_sign_sun.setTranslation(new Vector3((hud.core.getDisplay().getWidth()/24.7f),(hud.core.getDisplay().getHeight()/18.5f),0));
        quad_sign_sun.getSceneHints().setLightCombineMode(LightCombineMode.Off);
		
	}
	Quaternion q = new Quaternion();
	Quaternion q_d = new Quaternion();
	Vector3 axis = new Vector3(0,0,1);
	
	public void updateQuad(int direction, Time time)
	{
		
		q.fromAngleAxis(Math.PI*(-2*(time.hour*1f)/time.maxHour), axis);
		quad_sign_sun.setRotation(q);
		
		q_d.fromAngleAxis(Math.PI*(-2*(direction*6*1f)/24), axis);
		quad_sign_dir.setRotation(q_d);
	}
	
}
