# Example Configurations

This file shows various configuration examples for the access control system.

## Example 1: Mixed Access Modes

```json
{
  "contentAccessRules": {
    "notes": {
      "getting-started": {
        "mode": "open",
        "description": "Public getting started guide"
      },
      "personal-journal": {
        "mode": "password",
        "description": "My personal journal - password protected"
      },
      "team-notes": {
        "mode": "email-list",
        "description": "Team internal notes",
        "allowedEmails": [
          "alice@company.com",
          "bob@company.com",
          "charlie@company.com"
        ]
      }
    },
    "publications": {
      "public-article": {
        "mode": "open",
        "description": "Published article available to all"
      },
      "draft-paper": {
        "mode": "email-list",
        "description": "Draft for peer review",
        "allowedEmails": [
          "reviewer1@university.edu",
          "reviewer2@university.edu",
          "mentor@university.edu"
        ]
      }
    },
    "ideas": {
      "innovation-2025": {
        "mode": "password",
        "description": "2025 innovation roadmap"
      },
      "brainstorm-session": {
        "mode": "email-list",
        "description": "Collaborative brainstorm",
        "allowedEmails": [
          "team-lead@company.com",
          "product-manager@company.com",
          "designer@company.com",
          "developer@company.com"
        ]
      }
    },
    "pages": {
      "about": {
        "mode": "open",
        "description": "Public about page"
      },
      "contact": {
        "mode": "open",
        "description": "Public contact page"
      }
    }
  }
}
```

## Example 2: All Open (Default)

Use when all content is public:

```json
{
  "contentAccessRules": {
    "notes": {
      "note1": { "mode": "open", "description": "Note 1" },
      "note2": { "mode": "open", "description": "Note 2" }
    },
    "publications": {
      "article1": { "mode": "open", "description": "Article 1" }
    },
    "ideas": {
      "idea1": { "mode": "open", "description": "Idea 1" }
    },
    "pages": {
      "about": { "mode": "open", "description": "About" },
      "contact": { "mode": "open", "description": "Contact" }
    }
  }
}
```

## Example 3: Enterprise Setup

Complex organization with different access levels:

```json
{
  "contentAccessRules": {
    "notes": {
      "company-handbook": {
        "mode": "email-list",
        "description": "Company employee handbook",
        "allowedEmails": [
          "all-employees@company.com"
        ]
      },
      "executive-summary": {
        "mode": "email-list",
        "description": "Executive summary - leadership only",
        "allowedEmails": [
          "ceo@company.com",
          "cto@company.com",
          "cfo@company.com",
          "vp-engineering@company.com",
          "vp-product@company.com"
        ]
      },
      "confidential-strategy": {
        "mode": "password",
        "description": "Confidential strategic plan"
      }
    },
    "publications": {
      "public-whitepaper": {
        "mode": "open",
        "description": "Public technical whitepaper"
      },
      "customer-case-study": {
        "mode": "email-list",
        "description": "Customer case study - for sales team",
        "allowedEmails": [
          "sales@company.com",
          "account-manager@company.com"
        ]
      },
      "internal-research": {
        "mode": "password",
        "description": "Internal research findings"
      }
    },
    "ideas": {
      "feature-requests": {
        "mode": "email-list",
        "description": "Feature requests and ideas",
        "allowedEmails": [
          "product-team@company.com",
          "engineering@company.com"
        ]
      }
    },
    "pages": {
      "about": {
        "mode": "open",
        "description": "Public about page"
      },
      "careers": {
        "mode": "open",
        "description": "Careers and hiring"
      },
      "contact": {
        "mode": "open",
        "description": "Contact information"
      }
    }
  }
}
```

## Example 4: Academic Setup

Multiple courses and visibility levels:

```json
{
  "contentAccessRules": {
    "notes": {
      "course-intro": {
        "mode": "open",
        "description": "Course introduction - open to public"
      },
      "lecture-1": {
        "mode": "email-list",
        "description": "Lecture 1 - registered students only",
        "allowedEmails": [
          "student1@university.edu",
          "student2@university.edu",
          "student3@university.edu",
          "teaching-assistant@university.edu",
          "professor@university.edu"
        ]
      },
      "midterm-prep": {
        "mode": "password",
        "description": "Midterm exam preparation materials"
      },
      "student-submissions": {
        "mode": "email-list",
        "description": "Aggregated student work samples",
        "allowedEmails": [
          "professor@university.edu",
          "teaching-assistant@university.edu"
        ]
      }
    },
    "publications": {
      "course-syllabus": {
        "mode": "open",
        "description": "Public course syllabus"
      },
      "research-findings": {
        "mode": "email-list",
        "description": "Research findings - collaborators only",
        "allowedEmails": [
          "collaborator1@university.edu",
          "collaborator2@university.edu",
          "professor@university.edu"
        ]
      }
    },
    "ideas": {
      "research-ideas": {
        "mode": "password",
        "description": "Future research directions"
      }
    },
    "pages": {
      "about": {
        "mode": "open",
        "description": "Professor bio and background"
      },
      "office-hours": {
        "mode": "open",
        "description": "Office hours information"
      }
    }
  }
}
```

## Example 5: Portfolio Setup

Designer/Developer portfolio with selective access:

```json
{
  "contentAccessRules": {
    "notes": {
      "project-breakdown": {
        "mode": "open",
        "description": "Public project breakdown"
      },
      "client-feedback": {
        "mode": "password",
        "description": "Client feedback and testimonials"
      },
      "development-process": {
        "mode": "email-list",
        "description": "Detailed development process",
        "allowedEmails": [
          "mentor@designstudio.com",
          "collaborator@freelance.com"
        ]
      }
    },
    "publications": {
      "case-study-1": {
        "mode": "open",
        "description": "Public case study"
      },
      "technical-writeup": {
        "mode": "open",
        "description": "Technical article"
      }
    },
    "ideas": {
      "future-projects": {
        "mode": "password",
        "description": "Ideas for future projects"
      }
    },
    "pages": {
      "about": {
        "mode": "open",
        "description": "About me"
      },
      "contact": {
        "mode": "open",
        "description": "Contact information"
      },
      "services": {
        "mode": "open",
        "description": "Services offered"
      }
    }
  }
}
```

## Example 6: SaaS Product Site Setup

Mix of public marketing and restricted documentation:

```json
{
  "contentAccessRules": {
    "notes": {
      "product-roadmap": {
        "mode": "email-list",
        "description": "Public roadmap for logged-in users",
        "allowedEmails": [
          "customer@example.com",
          "partner@example.com"
        ]
      },
      "api-changelog": {
        "mode": "open",
        "description": "Public API changelog"
      },
      "beta-features": {
        "mode": "password",
        "description": "Beta feature access guide"
      }
    },
    "publications": {
      "blog-post-1": {
        "mode": "open",
        "description": "Public blog post"
      },
      "whitepapers": {
        "mode": "open",
        "description": "Public technical whitepaper"
      },
      "customer-success-stories": {
        "mode": "email-list",
        "description": "Customer success stories - customers and partners",
        "allowedEmails": [
          "customers@company.com",
          "partners@company.com"
        ]
      }
    },
    "ideas": {
      "feature-voting": {
        "mode": "open",
        "description": "Public feature requests"
      }
    },
    "pages": {
      "home": {
        "mode": "open",
        "description": "Public homepage"
      },
      "pricing": {
        "mode": "open",
        "description": "Public pricing page"
      },
      "docs": {
        "mode": "open",
        "description": "Public documentation"
      },
      "contact": {
        "mode": "open",
        "description": "Contact page"
      }
    }
  }
}
```

## Migration Path

### Phase 1: All Open
Start with everything public while setting up:
```json
"mode": "open"  // All content
```

### Phase 2: Add Password Protection
Gradually add password protection to sensitive content:
```json
"mode": "password"  // For confidential items
```

### Phase 3: Add Email Lists
Create groups for collaborative content:
```json
"mode": "email-list"
"allowedEmails": ["team@example.com"]
```

### Phase 4: Optimize
Fine-tune access based on actual usage patterns

## Management Tips

1. **Group similar emails**: Use email groups/distribution lists
   ```json
   "allowedEmails": ["team-leads@company.com", "interns@company.com"]
   ```

2. **Document access rules**: Use descriptive names
   ```json
   "description": "Q4 earnings report - leadership only"
   ```

3. **Regular audits**: Review who has access periodically

4. **Keep passwords strong**: Generated automatically, but document for team

5. **Archive old content**: Remove access rules for archived content
