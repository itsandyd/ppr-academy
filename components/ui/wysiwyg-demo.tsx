"use client";

import { useState } from "react";
import { WysiwygEditor } from "./wysiwyg-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

export function WysiwygDemo() {
  const [content, setContent] = useState(`
    <h1>Chapter: Understanding EQ Three</h1>
    <p>Welcome to this comprehensive guide on <strong>EQ Three</strong>, one of the most powerful tools in your audio arsenal.</p>
    
    <h2>What is EQ Three?</h2>
    <p>EQ Three is a <em>3-band equalizer</em> that allows you to:</p>
    <ul>
      <li>Boost or cut <strong>high frequencies</strong></li>
      <li>Adjust <strong>mid-range</strong> clarity</li>
      <li>Control <strong>low-end</strong> power</li>
    </ul>

    <h2>Key Features</h2>
    <ol>
      <li><strong>High Band:</strong> Controls frequencies above 2.5kHz</li>
      <li><strong>Mid Band:</strong> Handles the crucial 200Hz - 2.5kHz range</li>
      <li><strong>Low Band:</strong> Manages bass frequencies below 200Hz</li>
    </ol>

    <blockquote>
      <p>"EQ is not about making things louder, it's about making space for every element to shine." - Audio Engineer Wisdom</p>
    </blockquote>

    <h3>Pro Tips</h3>
    <p>Remember to always <code>EQ with your ears</code>, not just your eyes. The visual feedback is helpful, but your ears are the final judge.</p>
  `);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WYSIWYG Editor Demo</CardTitle>
          <CardDescription>
            This shows how the rich text editor works for chapter content creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WysiwygEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your chapter content..."
            className="mb-4"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview (How it appears to students)</CardTitle>
          <CardDescription>
            This is how the formatted content will look in the course player.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-base lg:prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
