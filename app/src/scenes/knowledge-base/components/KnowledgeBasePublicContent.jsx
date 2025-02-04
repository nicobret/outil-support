import React, { useMemo } from "react";
import Wrapper from "./Wrapper";
import Breadcrumb from "./BreadCrumb";
import KnowledgeBasePublicSection from "./KnowledgeBasePublicSection";
import KnowledgeBasePublicNoAnswer from "./KnowledgeBasePublicNoAnswer";
import KnowledgeBasePublicArticle from "./KnowledgeBasePublicArticle";

const KnowledgeBasePublicContent = ({ item, isLoading }) => {
  const group = useMemo(() => {
    return item?.group || item?.parents?.[0]?.group;
  }, [item]);

  return (
    <Wrapper>
      <div className="flex min-h-screen flex-col md:min-h-full">
        <div className="bg-snu-purple-900 print:bg-transparent">
          <div className="wrapper h-full">
            <Breadcrumb parents={item?.parents || []} path="/base-de-connaissance" />
            <div className="py-4">
              {<h5 className="max-w-3xl pb-2 text-base uppercase text-snu-purple-100 md:text-lg print:text-black">{group}</h5>}
              <h1 className="mb-6  text-4xl font-bold text-white md:text-5xl print:mb-0 print:text-black">{item?.title}</h1>
              <h6 className="text-base text-snu-purple-100 md:text-lg lg:text-xl print:text-black">{item?.description}</h6>
            </div>
          </div>
        </div>
        {item.type === "article" && <KnowledgeBasePublicArticle item={item} isLoading={isLoading} />}
        {item.type === "section" && <KnowledgeBasePublicSection item={item} isLoading={isLoading} />}
        <KnowledgeBasePublicNoAnswer />
      </div>
    </Wrapper>
  );
};

export default KnowledgeBasePublicContent;
