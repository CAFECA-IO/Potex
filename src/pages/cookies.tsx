// src/pages/cookies.tsx
import fs from "fs";
import path from "path";
import React from "react";
import Layout from "@/layouts/Nav";
import { GetStaticProps } from "next";
import FooterSection from "@/components/pages/frontend/Footer";

interface CookiesPageProps {
  content: string;
}

export const getStaticProps: GetStaticProps<CookiesPageProps> = async () => {
  const filePath = path.join(process.cwd(), "template", "cookies.html");
  const fileContents = fs.readFileSync(filePath, "utf8");

  return {
    props: {
      content: fileContents,
    },
  };
};

const CookiesPage: React.FC<CookiesPageProps> = ({ content }) => {
  return (
    <Layout color="muted" horizontal>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10 prose prose-lg dark:prose-dark">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
      <FooterSection />
    </Layout>
  );
};

export default CookiesPage;
