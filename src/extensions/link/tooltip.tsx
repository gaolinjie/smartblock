import * as React from 'react';
import { EditorView } from "prosemirror-view";
import { EditorState, Plugin } from "prosemirror-state";
import { render, unmountComponentAtNode } from "react-dom";
import TooltipReact from './tooltip-react';
import { getOffset } from '../../utils';

const calculateStyle = (view: EditorView) => {
  const { selection } = view.state
  const app = document.querySelector('#container') as HTMLDivElement;
  const dom = view.domAtPos(selection.$anchor.pos);
  const { $anchor } = view.state.selection;
  const { nodeAfter } = $anchor;
  let link = null;

  if (nodeAfter) {
    link = nodeAfter.marks.find((mark) => {
      if (mark.type.name === 'link') {
        return true;
      }
    });
  }

  if (!selection || !app || !link)  {
    return {
      left: -1000,
      top: 0
    }
  }
  
  const flag = dom.node instanceof Element;
  const element = flag ? dom.node as HTMLElement : dom.node.parentElement;
  const elementTop = getOffset(element).top;
  const coords = view.coordsAtPos(selection.$anchor.pos);

  return {
    left: coords.left,
    top: elementTop + element.offsetHeight
  }
}


class Tooltip {
  tooltip: HTMLDivElement;

  constructor(view: EditorView) {
    this.tooltip = document.createElement('div');
    document.body.appendChild(this.tooltip);
    this.update(view, null);
  }

  render(view: EditorView) {
    const style = calculateStyle(view);
    const { selection} = view.state;
    const { $anchor } = selection;
    const { nodeBefore, nodeAfter, pos } = $anchor;
    let link = null;
    if (nodeAfter) {
      link = nodeAfter.marks.find((mark) => {
        if (mark.type.name === 'link') {
          return true;
        }
      });
    }
    let url = '';
    if (link) {
      url = link.attrs.href;
    }
    let beforePos = selection.from;
    let afterPos = selection.to;
    if (beforePos === afterPos && nodeBefore && nodeAfter) {
      beforePos = pos - nodeBefore.nodeSize;
      afterPos = pos + nodeAfter.nodeSize;
    }
    render(<TooltipReact style={style} url={url} onClick={(href) => {
      const { tr } = view.state;
      tr.removeMark(beforePos, afterPos, view.state.schema.marks.link);
      tr.addMark(
        beforePos, 
        afterPos, 
        view.state.schema.marks.link.create({ href }
      ));
      view.dispatch(tr);
    }} />, this.tooltip);
  }

  update(view: EditorView, oldState: EditorState) {
    this.render(view);
  }

  destroy() {
    unmountComponentAtNode(this.tooltip);
    this.tooltip.remove();
  }
}

export default () => {
  return new Plugin({
    view(view) {
      return new Tooltip(view);
    }
  })
}