package org.jcrpg.threed;

import java.util.logging.Logger;

import com.ardor3d.renderer.state.RenderState;
import com.ardor3d.renderer.state.RenderState.StateType;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.util.geom.SharedCopyLogic;

public class PooledNodeCopyLogic extends SharedCopyLogic {
    private static final Logger logger = Logger.getLogger(PooledNodeCopyLogic.class.getName());
   
    @Override
	protected Node clone(final Node original) {
        Node copy = null;
        //try {
            copy = new PooledSharedNode("");
        //} 
        copy.setName(original.getName() + "_copy");
        copy.getSceneHints().set(original.getSceneHints());
        copy.setTransform(original.getTransform());

        for (final StateType type : StateType.values()) {
            final RenderState state = original.getLocalRenderState(type);
            if (state != null) {
                copy.setRenderState(state);
            }
        }
        return copy;
    }
}
