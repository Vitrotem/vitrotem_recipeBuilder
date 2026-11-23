import type { CommandProps } from "@tiptap/core";
import { Fragment, type Node as ProseNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

/**
 * If the current textblock contains hard breaks (&lt;br&gt;), split it into
 * separate textblocks so heading/list toggles only affect one visual line.
 */
export function splitHardBreaksInTextblock({ state, tr, dispatch }: CommandProps): boolean {
  const { $from } = state.selection;

  let depth = -1;
  for (let d = $from.depth; d > 0; d -= 1) {
    if ($from.node(d).isTextblock) {
      depth = d;
      break;
    }
  }
  if (depth < 0) return false;

  const blockNode = $from.node(depth);
  const blockPos = $from.before(depth);

  const parts: ProseNode[][] = [];
  let inline: ProseNode[] = [];
  let hasHardBreak = false;

  blockNode.forEach((child) => {
    if (child.type.name === "hardBreak") {
      hasHardBreak = true;
      parts.push(inline);
      inline = [];
      return;
    }
    inline.push(child);
  });
  parts.push(inline);

  if (!hasHardBreak || parts.length <= 1) return false;

  // Which segment contains the cursor?
  const offsetInBlock = $from.parentOffset;
  let walked = 0;
  let targetIndex = 0;
  for (let i = 0; i < parts.length; i += 1) {
    const size = parts[i].reduce((sum, node) => sum + node.nodeSize, 0);
    const segmentEnd = walked + size;
    if (offsetInBlock <= segmentEnd || i === parts.length - 1) {
      targetIndex = i;
      break;
    }
    walked = segmentEnd + 1; // hardBreak node size
  }

  const type = blockNode.type;
  const attrs = blockNode.attrs;
  const newNodes = parts.map((nodes) =>
    type.create(attrs, nodes.length > 0 ? Fragment.from(nodes) : undefined),
  );

  if (!dispatch) return true;

  tr.replaceWith(blockPos, blockPos + blockNode.nodeSize, Fragment.from(newNodes));

  let cursorPos = blockPos + 1;
  for (let i = 0; i < targetIndex; i += 1) {
    cursorPos += newNodes[i].nodeSize;
  }
  cursorPos = Math.min(Math.max(cursorPos, 1), tr.doc.content.size);
  try {
    tr.setSelection(TextSelection.near(tr.doc.resolve(cursorPos)));
  } catch {
    // Selection restore is best-effort; format command can still proceed.
  }

  dispatch(tr);
  return true;
}

/** Collapse a range selection to a caret so block formats hit one textblock. */
export function collapseToCaret({ state, tr, dispatch }: CommandProps): boolean {
  if (state.selection.empty) return false;
  if (!dispatch) return true;
  tr.setSelection(TextSelection.create(state.doc, state.selection.from));
  dispatch(tr);
  return true;
}
