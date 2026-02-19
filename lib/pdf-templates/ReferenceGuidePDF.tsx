import React from "react";
import { Document, Page, View } from "@react-pdf/renderer";
import { styles } from "./styles";
import {
  CoverPage,
  TableOfContents,
  SectionHeader,
  BulletItem,
  NumberedItem,
  TipBox,
  WarningBox,
  PageFooter,
  type OutlineSection,
} from "./components";

// =============================================================================
// Props — uses the SAME Outline schema as the existing cheat sheet system
// =============================================================================

export interface ReferenceGuideProps {
  title: string;
  subtitle?: string;
  sections: OutlineSection[];
  footer?: string;
  showTOC?: boolean;
  badgeText?: string;
}

// =============================================================================
// Main Document
// =============================================================================

const ReferenceGuidePDF: React.FC<ReferenceGuideProps> = ({
  title,
  subtitle,
  sections,
  footer = "PausePlayRepeat",
  showTOC = true,
  badgeText,
}) => (
  <Document
    title={title}
    author="PausePlayRepeat"
    subject={badgeText === "CHEAT SHEET" ? "Module Cheat Sheet" : "Course Reference Guide"}
    creator="PausePlayRepeat"
  >
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <CoverPage title={title} subtitle={subtitle} badgeText={badgeText} />
    </Page>

    {/* Table of Contents (skipped for cheat sheets) */}
    {showTOC && (
      <Page size="A4" style={styles.page}>
        <TableOfContents sections={sections} />
        <PageFooter text={footer} />
      </Page>
    )}

    {/* Content Pages */}
    <Page size="A4" style={styles.contentPage} wrap>
      {sections.map((section, i) => (
        <View key={i} wrap>
          <SectionHeader heading={section.heading} type={section.type} />
          {section.items.map((item, j) => {
            if (item.isTip) {
              return (
                <TipBox key={j} text={item.text} subItems={item.subItems} />
              );
            }
            if (item.isWarning) {
              return (
                <WarningBox
                  key={j}
                  text={item.text}
                  subItems={item.subItems}
                />
              );
            }
            if (section.type === "step_by_step") {
              return (
                <NumberedItem
                  key={j}
                  number={j + 1}
                  text={item.text}
                  subItems={item.subItems}
                />
              );
            }
            return (
              <BulletItem
                key={j}
                text={item.text}
                subItems={item.subItems}
              />
            );
          })}
        </View>
      ))}
      <PageFooter text={footer} />
    </Page>
  </Document>
);

export default ReferenceGuidePDF;
