using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Optimus.Models
{
	/// <summary>
	/// Main front-end Optimus view model.
	/// </summary>
    public class BundleViewModel
    {
        [Display(Name = "Virtual path:")]
        public string VirtualPath { get; set; }

        [Display(Name = "Disable minification:")]
        public bool DisableMinification { get; set; }

        [Display(Name = "Files in bundle:")]
        public IEnumerable<string> Files { get; set; }

		/// <summary>
		/// Optimus bundling section's header bar text.
		/// </summary>
		[Display(Name = "Editing:")]
	    public string EditPath { get; set; }
    }
}