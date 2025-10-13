---
title: "Teaching: structured data prompts"
date: "2025-06-20"
readTime: "6 min"
type: "teaching"
---

# Teaching: structured data prompts

Slides + exercises for reliable LLM behaviors.

## Overview

This teaching session covers how to use structured prompts to get more reliable and consistent outputs from large language models. We'll explore techniques for data extraction, formatting, and validation.

## Key Concepts

### 1. Prompt Structure

A well-structured prompt should include:
- Clear instructions
- Examples of desired output
- Format specifications
- Error handling

### 2. Data Extraction Patterns

```python
# Example: Extract structured data from unstructured text
prompt = """
Extract the following information from the text below:
- Name: [person's name]
- Email: [email address]
- Phone: [phone number]
- Company: [company name]

Text: "John Smith works at Acme Corp. Contact him at john@acme.com or 555-1234."
"""
```

### 3. Validation Techniques

Always validate LLM outputs:
- Check required fields are present
- Verify data types match expectations
- Use schema validation when possible
- Implement fallback strategies

## Exercises

### Exercise 1: Basic Extraction
Extract contact information from a business card text.

### Exercise 2: Structured Output
Create a prompt that outputs a JSON object with specific fields.

### Exercise 3: Error Handling
Design a prompt that handles cases where required information is missing.

## Best Practices

1. **Be specific** - The more specific your instructions, the better the results
2. **Provide examples** - Show the LLM exactly what you want
3. **Use constraints** - Limit output length, format, or content
4. **Test thoroughly** - Try edge cases and unexpected inputs
5. **Iterate** - Refine prompts based on actual performance

## Resources

- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [LangChain Prompt Templates](https://python.langchain.com/docs/modules/model_io/prompts/prompt_templates/)

## Next Steps

Practice these techniques with your own data and use cases. Remember: good prompts are like good code—they're clear, maintainable, and solve real problems.
