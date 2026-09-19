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

package org.jcrpg.ui;

import java.util.HashMap;

import com.ardor3d.image.Texture;
import com.ardor3d.image.Texture.MinificationFilter;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.queue.RenderBucketType;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.scenegraph.hint.CullHint;
import com.ardor3d.scenegraph.hint.LightCombineMode;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.util.TextureManager;
import com.ardor3d.util.resource.ResourceLocatorTool;

/**
 * HUD display for system related things like load icon.
 * @author pali
 *
 */ 
public class SystemRelated {

	public HUD hud;
	
	public HashMap<String, Quad> hmQuad = new HashMap<String, Quad>();
	
	public SystemRelated(HUD hud, String[] quadIds, String[] images) throws Exception
	{
		this.hud = hud;
		int y = 0;
		for (String quString:quadIds)
		{
			Quad q = new Quad("Q_"+quString,hud.core.getDisplay().getWidth()/18,hud.core.getDisplay().getHeight()/14);
			Texture base_tex = TextureManager.load(ResourceLocatorTool.locateResource(UIBase.RES_TYPE_UI, images[y]), MinificationFilter.BilinearNearestMipMap, true);
	        TextureState state = new TextureState();
			state.setTexture(base_tex, 0);
			q.setRenderState(state);
			q.getSceneHints().setCullHint(CullHint.Always);
			q.setRenderState(hud.hudAS);
	        q.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);  
	        q.setTranslation(new Vector3((hud.core.getDisplay().getWidth()/40)*2+(y*(hud.core.getDisplay().getWidth()/17)),hud.core.getDisplay().getHeight()-(1*(hud.core.getDisplay().getHeight()/36))*2,0));
	        q.getSceneHints().setLightCombineMode(LightCombineMode.Off);
	        hmQuad.put(quString, q);
			hud.hudNode.attachChildAt(q,0);
			y++;
		}
	}
	
	public void setVisibility(boolean visible, String id)
	{
		try {
			hmQuad.get(id).getSceneHints().setCullHint(visible?CullHint.Never:CullHint.Always);
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
	}
	
	
}
