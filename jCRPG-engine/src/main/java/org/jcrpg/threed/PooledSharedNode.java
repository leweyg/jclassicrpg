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

package org.jcrpg.threed;

import org.jcrpg.threed.ModelPool.PoolItemContainer;

import com.ardor3d.scenegraph.Mesh;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.util.geom.SceneCopier;
import com.ardor3d.util.geom.SharedCopyLogic;

/**
 * Helper node extension for pooling JME SharedNodes.
 * @author pali
 *
 */
public class PooledSharedNode extends com.ardor3d.scenegraph.Node implements PooledNode {
	
	public static Node copyNode(String name, Node n)
	{
    	final SharedCopyLogic l = new SharedCopyLogic();
    	final Node n2 = (Node) SceneCopier.makeCopy(n, l);
    	n2.setName(name);
    	return (PooledSharedNode)n2;
    	
		
	}
	public static Mesh copyMesh(String name, Mesh n)
	{
    	final SharedCopyLogic l = new SharedCopyLogic();
    	final Mesh n2 = (Mesh) SceneCopier.makeCopy(n, l);
    	n2.setName(name);
    	return n2;
    	
		
	}
	
	public static PooledSharedNode instantiate(Node n)
	{
    	final SharedCopyLogic l = new PooledNodeCopyLogic();
    	final Node n2 = (Node) SceneCopier.makeCopy(n, l);
    	return (PooledSharedNode)n2;
	}
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	public org.jcrpg.threed.ModelPool.PoolItemContainer cont;

    public PooledSharedNode(String name) {
        super(name);
    }

	public PoolItemContainer getPooledContainer() {
		return cont;
	}

	public void setPooledContainer(PoolItemContainer cont) {
		this.cont = cont;
	}

	public void update(NodePlaceholder place) {
		// TODO Auto-generated method stub
		
	}

}
