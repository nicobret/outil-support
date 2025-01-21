import isEmail from "is-email";
import isUrl from "is-url";
import React, { useEffect, useState, useRef } from "react";
import { Editor, Element as SlateElement, Range, Transforms } from "slate";
import { useSlate } from "slate-react";
import { Button, CancelButton } from "./Buttons";
import { Icon, TextEditorButton } from "./components";
import Modal from "./Modal";
import API from "../../services/api";
import { useSelector } from "react-redux";

// import KnowledgeBaseContext from "../../scenes/knowledge-base/context";
//import KnowledgeBaseAdminTree from "../knowledge-base/KnowledgeBaseAdminTree";

const KnowledgeBaseArticleCard = ({ _id, position, title, slug, path, className = "", setUrl, setName }) => {
  return (
    <div
      key={_id}
      onClick={() => {
        setUrl(`https://support.snu.gouv.fr/${path}/${slug}`);
        setName(title);
      }}
    >
      <div target="_blank" rel="noreferrer" data-position={position} data-id={_id} className={`my-1 w-full shrink-0 grow-0 lg:my-1 ${className}`}>
        <article className={`flex items-center overflow-hidden rounded-lg bg-white py-1 shadow-lg `}>
          <div className="flex flex-grow flex-col">
            <header className="flex items-center justify-between px-8 leading-tight">
              <h3 className="text-lg text-black">{title}</h3>
            </header>
          </div>
        </article>
      </div>
    </div>
  );
};

export const isLinkActive = (editor) => {
  const [link] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
  });
  return link;
};

export const isLink = (text) => {
  if (!text) return false;
  if (text.includes("mailto:")) return isEmail(text.replace("mailto:", ""));
  return isUrl(text);
};

const displayLink = (url) => {
  if (url.includes("mailto:")) return url.replace("mailto:", "");
  return url;
};

export const unwrapLink = (editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
  });
};

export const wrapLink = (editor, url) => {
  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link = isLinkActive(editor);
  if (isCollapsed && !!link) {
    Transforms.select(editor, {
      anchor: { path: link[1], offset: 0 },
      focus: { path: link[1], offset: link?.[0]?.children[0]?.text?.length },
    });
  }
  if (!!link) {
    unwrapLink(editor);
  }

  const leaf = {
    type: "link",
    url,
    children: isCollapsed ? [{ text: displayLink(url) }] : [],
  };

  if (isCollapsed && !link) {
    Transforms.insertNodes(editor, leaf);
  } else {
    Transforms.wrapNodes(editor, leaf, { split: true });
    Transforms.collapse(editor, { edge: "end" });
  }
};

export const insertLink = (editor, url, name) => {
  if (!name) {
    if (editor.selection) {
      wrapLink(editor, url);
    }
    return;
  }
  const leaf = {
    type: "link",
    url,
    children: [{ text: displayLink(name) }],
  };
  Transforms.insertNodes(editor, leaf);
};

export const AddLinkButton = () => {
  const [open, setOpen] = useState(false);
  const editor = useSlate();
  return (
    <>
      <TextEditorButton
        active={isLinkActive(editor)}
        onMouseDown={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <Icon>link</Icon>
      </TextEditorButton>
      <AddLinkModal open={open} setOpen={() => setOpen(false)} />
    </>
  );
};

export const AddLinkModal = ({ open, setOpen }) => {
  const editor = useSlate();
  const link = isLinkActive(editor);
  const [url, setUrl] = useState(link?.[0]?.url);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [items, setItems] = useState([]);
  const [name, setName] = useState();
  const [hideItems, setHideItems] = useState(false);
  const user = useSelector((state) => state.Auth.user);

  const searchTimeout = useRef(null);

  const computeSearch = () => {
    if (url?.length > 0 && !isSearching) setIsSearching(true);
    if (!url?.length) {
      setIsSearching(false);
      clearTimeout(searchTimeout.current);
      setItems([]);
      return;
    }
    if (url.includes("https")) return;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      setHideItems(false);
      const response = await API.get({ path: `/knowledge-base/admin/search`, query: { search: url } });
      setIsSearching(false);
      if (response.ok) {
        setItems(response.data);
      }
    }, 250);
  };

  useEffect(() => {
    computeSearch();
    return () => {
      clearTimeout(searchTimeout.current);
      setIsSearching(false);
    };
  }, [url]);

  const onSubmit = (event) => {
    event.preventDefault();
    //if (!!computeError()) return setError(computeError());
    if (!!url) insertLink(editor, url, name);
    setOpen();
  };

  useEffect(() => {
    if (!!open) setUrl(link?.[0]?.url);
  }, [open]);

  useEffect(() => {
    if (!!error) setError("");
  }, [url]);

  const onUrlChange = (event) => {
    setUrl(event.target.value);
  };
  const onSlugChange = (slug) => setUrl(`/base-de-connaissance/${slug}`);

  return (
    <Modal open={open} setOpen={setOpen}>
      <form onSubmit={onSubmit} className="flex  flex-col items-start overflow-hidden">
        <h2 className="ml-4 mb-4 text-xl font-bold">{!!link ? "Éditer" : "Ajouter"} un lien</h2>
        <div className="flex w-full flex-shrink  flex-col overflow-hidden">
          <label htmlFor="title">Veuillez saisir une url :</label>
          <input className="border-2 p-2" placeholder="https://snu.gouv.fr/ ?" name="url" defaultValue={url} value={url} onChange={onUrlChange} />
          <span className=" mt-1 text-xs text-red-500">{error}</span>
          {user.role === "AGENT" &&
            items
              ?.slice(0, 8)
              .map((item) => (
                <KnowledgeBaseArticleCard
                  key={item._id}
                  _id={item._id}
                  position={item.position}
                  title={item.type === "article" ? item.title : `📂 ${item.title}`}
                  slug={item.slug}
                  path={"/base-de-connaissance"}
                  className="!my-0"
                  contentClassName="!py-2 !shadow-none !rounded-none border-b-2"
                  setUrl={setUrl}
                  setName={setName}
                />
              ))}
          {/* <div className="overflow-auto">
            <KnowledgeBaseAdminTree visible onClick={onSlugChange} />
          </div> */}
        </div>
        <div className="mt-3.5 flex w-full justify-between gap-3">
          <CancelButton
            type="reset"
            onClick={setOpen}
            className="h-[38px] flex-1 rounded-md border border-gray-300 px-4 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Annuler
          </CancelButton>
          <Button type="submit" className="h-[38px] flex-1 rounded-md bg-accent-color  px-4 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500">
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const RemoveLinkButton = () => {
  const editor = useSlate();

  return (
    <TextEditorButton
      active={isLinkActive(editor)}
      onMouseDown={() => {
        if (isLinkActive(editor)) {
          unwrapLink(editor);
        }
      }}
    >
      <Icon>link_off</Icon>
    </TextEditorButton>
  );
};
