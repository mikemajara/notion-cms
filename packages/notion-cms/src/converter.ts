/**
 * Content conversion service for transforming Notion blocks to Markdown and HTML
 */

/**
 * Simplified representation of a Notion block
 */
export interface SimpleBlock {
  id: string;
  type: string;
  content: any;
  children?: SimpleBlock[];
  hasChildren: boolean;
}

/**
 * Table block content structure
 */
export interface TableBlockContent {
  tableWidth: number;
  hasColumnHeader: boolean;
  hasRowHeader: boolean;
}

/**
 * Table row cell content structure
 */
export interface TableRowCell {
  plainText: string;
  richText: any[];
}

/**
 * Table row block content structure
 */
export interface TableRowBlockContent {
  cells: TableRowCell[];
}

/**
 * Simplified representation of a table block
 */
export interface SimpleTableBlock extends SimpleBlock {
  type: "table";
  content: TableBlockContent;
  children: SimpleTableRowBlock[];
}

/**
 * Simplified representation of a table row block
 */
export interface SimpleTableRowBlock extends SimpleBlock {
  type: "table_row";
  content: TableRowBlockContent;
}

/**
 * Context for tracking list state during markdown conversion
 */
interface ListContext {
  type: "bullet" | "numbered" | null;
  level: number;
  numbering: number[]; // Track numbering at each level
  bulletStyles: string[]; // Different bullet styles for different levels
}

/**
 * Content conversion service for transforming Notion blocks to different formats
 */
export class ContentConverter {
  /**
   * Convert page content to Markdown
   * @param blocks Array of blocks to convert
   * @returns Markdown string
   */
  public blocksToMarkdown(blocks: SimpleBlock[]): string {
    if (!blocks || !Array.isArray(blocks)) return "";

    const context: ListContext = {
      type: null,
      level: 0,
      numbering: [],
      bulletStyles: ["-", "*", "+", "-"], // Cycle through different bullet styles
    };

    return this.processBlocksGroup(blocks, context);
  }

  /**
   * Convert page content to HTML
   * @param blocks Array of blocks to convert
   * @returns HTML string
   */
  public blocksToHtml(blocks: SimpleBlock[]): string {
    if (!blocks || !Array.isArray(blocks)) return "";

    const html = blocks.map((block) => this.blockToHtml(block)).join("");
    return html;
  }

  /**
   * Process a group of blocks, handling list grouping and proper spacing
   * @param blocks Array of blocks to process
   * @param context Current list context
   * @returns Processed markdown string
   */
  private processBlocksGroup(
    blocks: SimpleBlock[],
    context: ListContext
  ): string {
    if (!blocks || blocks.length === 0) return "";

    const result: string[] = [];
    let i = 0;

    while (i < blocks.length) {
      const block = blocks[i];

      if (this.isListItem(block.type)) {
        // Process consecutive list items as a group
        const listGroup = this.extractListGroup(blocks, i);
        const listMarkdown = this.processListGroup(listGroup.blocks, context);
        result.push(listMarkdown);
        i = listGroup.nextIndex;
      } else {
        // Process single non-list block
        const blockMarkdown = this.blockToMarkdown(block, context);
        if (blockMarkdown.trim()) {
          result.push(blockMarkdown);
        }
        i++;
      }
    }

    return result.join("\n\n");
  }

  /**
   * Check if a block type is a list item
   */
  private isListItem(type: string): boolean {
    return type === "bulleted_list_item" || type === "numbered_list_item";
  }

  /**
   * Extract consecutive list items of the same type
   */
  private extractListGroup(
    blocks: SimpleBlock[],
    startIndex: number
  ): { blocks: SimpleBlock[]; nextIndex: number } {
    const firstBlock = blocks[startIndex];
    const listType = firstBlock.type;
    const listBlocks: SimpleBlock[] = [];
    let i = startIndex;

    while (i < blocks.length && blocks[i].type === listType) {
      listBlocks.push(blocks[i]);
      i++;
    }

    return { blocks: listBlocks, nextIndex: i };
  }

  /**
   * Process a group of list items with proper numbering and indentation
   */
  private processListGroup(
    blocks: SimpleBlock[],
    parentContext: ListContext
  ): string {
    if (blocks.length === 0) return "";

    const firstBlock = blocks[0];
    const listType =
      firstBlock.type === "bulleted_list_item" ? "bullet" : "numbered";

    // Create new context for this list level
    const context: ListContext = {
      type: listType,
      level: parentContext.level,
      numbering: [...parentContext.numbering],
      bulletStyles: parentContext.bulletStyles,
    };

    // Initialize numbering for this level if it's a numbered list
    if (listType === "numbered") {
      if (context.numbering.length <= context.level) {
        context.numbering[context.level] = 1;
      }
    }

    const result: string[] = [];

    blocks.forEach((block) => {
      const blockMarkdown = this.blockToMarkdown(block, context);
      if (blockMarkdown.trim()) {
        result.push(blockMarkdown);
      }

      // Increment numbering for numbered lists
      if (listType === "numbered" && context.numbering.length > context.level) {
        context.numbering[context.level]++;
      }
    });

    return result.join("\n");
  }

  /**
   * Convert a single block to Markdown
   * @param block The block to convert
   * @param context Current list context and nesting information
   * @returns Markdown string
   */
  private blockToMarkdown(block: SimpleBlock, context: ListContext): string {
    const { type, content, children } = block;

    // Calculate proper indentation based on context
    const baseIndent = "  ".repeat(context.level);
    let markdown = "";

    switch (type) {
      case "paragraph":
        markdown = `${baseIndent}${content.text}`;
        break;

      case "heading_1":
        markdown = `${baseIndent}# ${content.text}`;
        break;

      case "heading_2":
        markdown = `${baseIndent}## ${content.text}`;
        break;

      case "heading_3":
        markdown = `${baseIndent}### ${content.text}`;
        break;

      case "bulleted_list_item":
        const bulletStyle =
          context.bulletStyles[context.level % context.bulletStyles.length];
        markdown = `${baseIndent}${bulletStyle} ${content.text}`;
        break;

      case "numbered_list_item":
        const number = context.numbering[context.level] || 1;
        markdown = `${baseIndent}${number}. ${content.text}`;
        break;

      case "to_do":
        const checkbox = content.checked ? "[x]" : "[ ]";
        markdown = `${baseIndent}- ${checkbox} ${content.text}`;
        break;

      case "toggle":
        markdown = `${baseIndent}<details>\n${baseIndent}<summary>${content.text}</summary>\n\n`;
        if (children && children.length > 0) {
          const childContext: ListContext = {
            ...context,
            level: context.level + 1,
          };
          markdown += this.processBlocksGroup(children, childContext);
        }
        markdown += `\n${baseIndent}</details>`;
        break;

      case "code":
        markdown = `${baseIndent}\`\`\`${content.language || ""}\n${
          content.text
        }\n${baseIndent}\`\`\``;
        break;

      case "quote":
        markdown = `${baseIndent}> ${content.text}`;
        break;

      case "divider":
        markdown = `${baseIndent}---`;
        break;

      case "image":
        const imageCaption = content.caption ? ` "${content.caption}"` : "";
        markdown = `${baseIndent}![Image${imageCaption}](${content.url})`;
        break;

      case "bookmark":
      case "embed":
      case "link_preview":
        markdown = `${baseIndent}[${content.caption || content.url}](${
          content.url
        })`;
        break;

      case "callout":
        markdown = `${baseIndent}> **${content.icon?.emoji || ""}** ${
          content.text
        }`;
        break;

      case "table":
        markdown = this.tableToMarkdown(block as SimpleTableBlock, baseIndent);
        break;

      case "table_row":
        // Table rows are handled within table conversion, skip individual processing
        markdown = "";
        break;

      default:
        // For unsupported blocks, try to extract text if possible
        if (content && content.text) {
          markdown = `${baseIndent}${content.text}`;
        } else {
          markdown = `${baseIndent}<!-- Unsupported block type: ${type} -->`;
        }
    }

    // Add children recursively for list items with proper nesting
    if (children && children.length > 0 && type !== "toggle") {
      if (this.isListItem(type)) {
        // For list items, children should be indented and maintain list context
        const childContext: ListContext = {
          ...context,
          level: context.level + 1,
        };
        const childrenMarkdown = this.processBlocksGroup(
          children,
          childContext
        );
        if (childrenMarkdown.trim()) {
          markdown += "\n" + childrenMarkdown;
        }
      } else {
        // For non-list items, add children with normal spacing
        const childContext: ListContext = {
          ...context,
          level: context.level + 1,
        };
        const childrenMarkdown = this.processBlocksGroup(
          children,
          childContext
        );
        if (childrenMarkdown.trim()) {
          markdown += "\n\n" + childrenMarkdown;
        }
      }
    }

    return markdown;
  }

  /**
   * Convert a table block to Markdown format
   * @param tableBlock The table block to convert
   * @param baseIndent Base indentation to apply
   * @returns Markdown string
   */
  private tableToMarkdown(
    tableBlock: SimpleTableBlock,
    baseIndent: string
  ): string {
    const { content, children } = tableBlock;

    if (!children || children.length === 0) {
      return `${baseIndent}<!-- Empty table -->`;
    }

    const rows = children as SimpleTableRowBlock[];
    const tableRows: string[] = [];

    // Process each row
    rows.forEach((row, rowIndex) => {
      const cells = row.content.cells.map((cell) => cell.plainText || "");
      const markdownRow = `${baseIndent}| ${cells.join(" | ")} |`;
      tableRows.push(markdownRow);

      // Add header separator after first row (required for valid Markdown tables)
      if (rowIndex === 0) {
        const separator = `${baseIndent}|${cells
          .map(() => " --- ")
          .join("|")}|`;
        tableRows.push(separator);
      }
    });

    return tableRows.join("\n");
  }

  /**
   * Convert a single block to HTML
   * @param block The block to convert
   * @param level Nesting level for recursive calls
   * @returns HTML string
   */
  private blockToHtml(block: SimpleBlock, level: number = 0): string {
    const { type, content, children } = block;

    let html = "";

    switch (type) {
      case "paragraph":
        html = `<p>${content.text}</p>`;
        break;

      case "heading_1":
        html = `<h1>${content.text}</h1>`;
        break;

      case "heading_2":
        html = `<h2>${content.text}</h2>`;
        break;

      case "heading_3":
        html = `<h3>${content.text}</h3>`;
        break;

      case "bulleted_list_item":
        html = `<li>${content.text}</li>`;
        // If it's part of a list, we'll wrap it in <ul> later
        if (level === 0) {
          html = `<ul>${html}</ul>`;
        }
        break;

      case "numbered_list_item":
        html = `<li>${content.text}</li>`;
        // If it's part of a list, we'll wrap it in <ol> later
        if (level === 0) {
          html = `<ol>${html}</ol>`;
        }
        break;

      case "to_do":
        const checked = content.checked ? " checked" : "";
        html = `<div class="to-do"><input type="checkbox"${checked} disabled /><span>${content.text}</span></div>`;
        break;

      case "toggle":
        html = `<details>
          <summary>${content.text}</summary>
          ${
            children && children.length > 0
              ? children
                  .map((child) => this.blockToHtml(child, level + 1))
                  .join("")
              : ""
          }
        </details>`;
        break;

      case "code":
        html = `<pre><code class="language-${
          content.language || "plaintext"
        }">${content.text}</code></pre>`;
        break;

      case "quote":
        html = `<blockquote>${content.text}</blockquote>`;
        break;

      case "divider":
        html = `<hr />`;
        break;

      case "image":
        const caption = content.caption
          ? `<figcaption>${content.caption}</figcaption>`
          : "";
        html = `<figure><img src="${content.url}" alt="${
          content.caption || "Image"
        }" />${caption}</figure>`;
        break;

      case "bookmark":
      case "embed":
      case "link_preview":
        html = `<a href="${
          content.url
        }" target="_blank" rel="noopener noreferrer">${
          content.caption || content.url
        }</a>`;
        break;

      case "callout":
        const icon = content.icon?.emoji
          ? `<span class="icon">${content.icon.emoji}</span>`
          : "";
        html = `<div class="callout">${icon}<div class="callout-content">${content.text}</div></div>`;
        break;

      case "table":
        html = this.tableToHtml(block as SimpleTableBlock);
        break;

      case "table_row":
        // Table rows are handled within table conversion, skip individual processing
        html = "";
        break;

      default:
        // For unsupported blocks, try to extract text if possible
        if (content && content.text) {
          html = `<div>${content.text}</div>`;
        } else {
          html = `<!-- Unsupported block type: ${type} -->`;
        }
    }

    // Add children recursively for blocks that weren't handled specially
    if (children && children.length > 0 && type !== "toggle") {
      // Special handling for list types to maintain proper HTML structure
      if (type === "bulleted_list_item" && level === 0) {
        html = `<ul>${html}${children
          .map((child) => this.blockToHtml(child, level + 1))
          .join("")}</ul>`;
      } else if (type === "numbered_list_item" && level === 0) {
        html = `<ol>${html}${children
          .map((child) => this.blockToHtml(child, level + 1))
          .join("")}</ol>`;
      } else {
        html += children
          .map((child) => this.blockToHtml(child, level + 1))
          .join("");
      }
    }

    return html;
  }

  /**
   * Convert a table block to HTML format
   * @param tableBlock The table block to convert
   * @returns HTML string
   */
  private tableToHtml(tableBlock: SimpleTableBlock): string {
    const { content, children } = tableBlock;

    if (!children || children.length === 0) {
      return `<!-- Empty table -->`;
    }

    const rows = children as SimpleTableRowBlock[];
    let tableHtml = "<table>";

    rows.forEach((row, rowIndex) => {
      const isHeaderRow = rowIndex === 0 && content.hasColumnHeader;
      const cellTag = isHeaderRow ? "th" : "td";

      const cells = row.content.cells
        .map((cell) => `<${cellTag}>${cell.plainText || ""}</${cellTag}>`)
        .join("");

      const rowHtml = `<tr>${cells}</tr>`;

      // Wrap header row in thead, body rows in tbody
      if (isHeaderRow) {
        tableHtml += `<thead>${rowHtml}</thead>`;
        if (rows.length > 1) {
          tableHtml += "<tbody>";
        }
      } else {
        tableHtml += rowHtml;
      }
    });

    // Close tbody if we opened it
    if (content.hasColumnHeader && rows.length > 1) {
      tableHtml += "</tbody>";
    }

    tableHtml += "</table>";
    return tableHtml;
  }

  /**
   * Extract plain text from rich text objects
   * @param richText Array of rich text objects
   * @returns Plain text string
   */
  private extractRichText(richText: any[] = []): string {
    if (!richText || !Array.isArray(richText)) return "";
    return richText.map((text) => text.plain_text || "").join("");
  }
}
